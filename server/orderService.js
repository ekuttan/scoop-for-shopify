const axios = require('axios');
const { getShop } = require('./database');
const { getAllDiscountCodes } = require('./discountService');
const { getOrderCampaignStatus, updateOrderCampaignStatus, getAllOrderCampaignStatuses } = require('./database');

/**
 * Get all orders with campaign status
 */
async function getAllOrders(shopDomain) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  // Get discount codes with order information
  const discountCodes = await getAllDiscountCodes(shopDomain);
  
  // Get campaign statuses from database
  const campaignStatuses = await getAllOrderCampaignStatuses(shopDomain);
  const campaignStatusMap = {};
  campaignStatuses.forEach(cs => {
    // Store by shopify_order_id (numeric ID as string)
    campaignStatusMap[cs.shopify_order_id] = cs;
  });

  // Merge discount codes with campaign status
  const orders = discountCodes.map(dc => {
    // Use shopify_order_id (numeric) for campaign status lookup
    const orderIdForLookup = dc.shopify_order_id ? dc.shopify_order_id.toString() : null;
    const campaignStatus = orderIdForLookup ? campaignStatusMap[orderIdForLookup] : null;
    
      return {
        ...dc,
        id: dc.id,
        shopify_order_id: dc.shopify_order_id || null,
        campaign_status: campaignStatus ? campaignStatus.campaign_status : null,
        refund_amount: campaignStatus ? campaignStatus.refund_amount : null,
        refund_transaction_id: campaignStatus ? campaignStatus.refund_transaction_id : null,
        restock_status: campaignStatus ? campaignStatus.restock_status : null,
      };
  });

  return orders;
}

/**
 * Restock products from an order
 */
async function restockOrderProducts(shopDomain, shopifyOrderId, order) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;

  try {
    // Get fulfillment location from the order
    // Use the first fulfillment location, or get primary location if no fulfillments
    let locationId = null;
    
    if (order.fulfillments && order.fulfillments.length > 0) {
      locationId = order.fulfillments[0].location_id;
    } else {
      // If no fulfillments, get the primary location
      const locationsUrl = `https://${shopDomain}/admin/api/2024-10/locations.json`;
      const locationsResponse = await axios.get(locationsUrl, {
        headers: {
          'X-Shopify-Access-Token': access_token,
        },
      });
      const locations = locationsResponse.data.locations || [];
      if (locations.length > 0) {
        locationId = locations[0].id;
      }
    }

    if (!locationId) {
      throw new Error('No location found for restocking');
    }

    // Restock each line item
    const restockPromises = order.line_items.map(async (lineItem) => {
      if (!lineItem.variant_id) {
        console.warn(`Line item ${lineItem.id} has no variant_id, skipping restock`);
        return;
      }

      // Get variant details to get inventory_item_id
      const variantUrl = `https://${shopDomain}/admin/api/2024-10/variants/${lineItem.variant_id}.json`;
      let variant;
      try {
        const variantResponse = await axios.get(variantUrl, {
          headers: {
            'X-Shopify-Access-Token': access_token,
          },
        });
        variant = variantResponse.data.variant;
      } catch (variantErr) {
        console.error(`Error fetching variant ${lineItem.variant_id}:`, variantErr);
        throw new Error(`Failed to fetch variant ${lineItem.variant_id}`);
      }

      if (!variant.inventory_item_id) {
        console.warn(`Variant ${lineItem.variant_id} has no inventory_item_id, skipping restock`);
        return;
      }

      // Adjust inventory level
      const adjustUrl = `https://${shopDomain}/admin/api/2024-10/inventory_levels/adjust.json`;
      const adjustData = {
        location_id: locationId,
        inventory_item_id: variant.inventory_item_id,
        available_adjustment: lineItem.quantity, // Positive value to increase inventory
      };

      try {
        await axios.post(adjustUrl, adjustData, {
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json',
          },
        });
        console.log(`Restocked ${lineItem.quantity} units of variant ${lineItem.variant_id}`);
      } catch (adjustErr) {
        console.error(`Error adjusting inventory for variant ${lineItem.variant_id}:`, adjustErr.response?.data || adjustErr.message);
        throw new Error(`Failed to restock variant ${lineItem.variant_id}`);
      }
    });

    await Promise.all(restockPromises);
    return { success: true, locationId };
  } catch (error) {
    console.error('Error restocking products:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Mark order as campaign promise met and initiate refund
 */
async function markCampaignPromiseMet(shopDomain, orderId, shopifyOrderId, shouldRestock = false) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;

  // Get order details from Shopify
  const orderUrl = `https://${shopDomain}/admin/api/2024-10/orders/${shopifyOrderId}.json`;
  let order;
  try {
    const orderResponse = await axios.get(orderUrl, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });
    order = orderResponse.data.order;
  } catch (error) {
    console.error('Error fetching order:', error.response?.data || error.message);
    throw new Error('Failed to fetch order details from Shopify');
  }

  // Check if order is fulfilled
  if (order.fulfillment_status !== 'fulfilled') {
    throw new Error('Order must be fulfilled before marking campaign promise met');
  }

  // Calculate refund amount (full amount paid by customer)
  // This is the total_price which is what the customer actually paid after discounts
  const refundAmount = parseFloat(order.total_price || 0);

  // Get transactions to find the payment transaction for refund
  const transactionsUrl = `https://${shopDomain}/admin/api/2024-10/orders/${shopifyOrderId}/transactions.json`;
  let transactions = [];
  try {
    const transactionsResponse = await axios.get(transactionsUrl, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });
    transactions = transactionsResponse.data.transactions || [];
  } catch (txnErr) {
    console.error('Error fetching transactions:', txnErr);
    // Continue with refund attempt - Shopify will handle transaction matching
  }

  // Find the successful payment transaction(s)
  const paymentTransactions = transactions.filter(txn => 
    txn.kind === 'sale' && txn.status === 'success' && parseFloat(txn.amount || 0) > 0
  );

  // Create refund in Shopify
  // Shopify refund API requires refund_line_items and optionally transactions
  const refundUrl = `https://${shopDomain}/admin/api/2024-10/orders/${shopifyOrderId}/refunds.json`;
  
  // Build refund data - always include refund_line_items
  const refundData = {
    refund: {
      note: 'Campaign promise met - refund for loyalty program',
      notify: false, // Don't notify customer automatically
      refund_line_items: order.line_items.map(item => ({
        line_item_id: item.id,
        quantity: item.quantity,
      })),
    },
  };

  // Include transactions if we found payment transactions
  // Each transaction must have a 'kind' field set to 'refund'
  if (paymentTransactions.length > 0) {
    refundData.refund.transactions = paymentTransactions.map(txn => ({
      parent_id: txn.id,
      amount: refundAmount.toString(),
      gateway: txn.gateway || 'manual',
      kind: 'refund', // Required field for refund transactions
    }));
  }
  // If no transactions found, Shopify will automatically match them

  let refundTransactionId = null;
  try {
    const refundResponse = await axios.post(refundUrl, refundData, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
    });

    const refund = refundResponse.data.refund;
    refundTransactionId = refund.id ? refund.id.toString() : null;

    // Update campaign status to "Campaign Promise Met" first
    await updateOrderCampaignStatus(
      shopDomain,
      shopifyOrderId.toString(),
      'Campaign Promise Met',
      order.discount_codes && order.discount_codes.length > 0 ? order.discount_codes[0].code : null,
      refundAmount.toString(),
      refundTransactionId,
      null // restock_status
    );

    // If restock is requested, trigger it asynchronously
    if (shouldRestock) {
      // Set restock status to pending
      await updateOrderCampaignStatus(
        shopDomain,
        shopifyOrderId.toString(),
        null, // Don't change campaign_status
        null,
        null,
        null,
        'Restock Pending'
      );

      // Trigger restock asynchronously (don't await)
      restockOrderProducts(shopDomain, shopifyOrderId, order)
        .then(() => {
          // Update restock status to success
          return updateOrderCampaignStatus(
            shopDomain,
            shopifyOrderId.toString(),
            null,
            null,
            null,
            null,
            'Restocked'
          );
        })
        .catch((restockError) => {
          console.error('Error in async restock:', restockError);
          // Update restock status to failed
          return updateOrderCampaignStatus(
            shopDomain,
            shopifyOrderId.toString(),
            null,
            null,
            null,
            null,
            'Restock Failed'
          );
        });
    }

    // Mark as completed immediately after successful refund
    // The refund is processed synchronously by Shopify API
    await updateOrderCampaignStatus(
      shopDomain,
      shopifyOrderId.toString(),
      'Campaign Completed',
      null,
      null,
      null,
      null // restock_status - don't change it if already set
    );

    return {
      success: true,
      refundId: refundTransactionId,
      refundAmount,
      message: 'Refund initiated successfully',
      restockInitiated: shouldRestock,
    };
  } catch (error) {
    console.error('Error creating refund:', error.response?.data || error.message);
    
    // Still mark as campaign promise met even if refund fails (for tracking)
    try {
      await updateOrderCampaignStatus(
        shopDomain,
        shopifyOrderId.toString(),
        'Campaign Promise Met',
        order.discount_codes && order.discount_codes.length > 0 ? order.discount_codes[0].code : null,
        refundAmount.toString(),
        null,
        null // restock_status
      );
    } catch (updateErr) {
      console.error('Error updating campaign status:', updateErr);
    }

    throw new Error(
      error.response?.data?.errors?.message ||
      error.response?.data?.error ||
      'Failed to create refund in Shopify'
    );
  }
}

module.exports = {
  getAllOrders,
  markCampaignPromiseMet,
};

