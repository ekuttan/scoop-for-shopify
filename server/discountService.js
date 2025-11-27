const axios = require('axios');
const { getShop } = require('./database');

/**
 * Generate a random promo code
 */
function generatePromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a discount code in Shopify
 */
async function createDiscountCode(shopDomain, discountConfig) {
  const {
    code,
    percentage,
    minimumOrderAmount,
    expiresAt,
    usageLimit = 1, // Default to one-time use
  } = discountConfig;

  // Get shop and access token from database
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;
  const url = `https://${shopDomain}/admin/api/2024-10/discount_codes.json`;

  // Calculate discount value (Shopify uses fixed_amount for percentage discounts)
  // For percentage discounts, we use price_rule with percentage type
  const priceRuleUrl = `https://${shopDomain}/admin/api/2024-10/price_rules.json`;

  // Create price rule (discount rule)
  const priceRuleData = {
    price_rule: {
      title: `Discount: ${code}`,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'percentage',
      value: `-${percentage}`, // Shopify expects negative for discount
      customer_selection: 'all',
      starts_at: new Date().toISOString(),
      usage_limit: usageLimit,
      ...(minimumOrderAmount && {
        prerequisite_subtotal_range: {
          greater_than_or_equal_to: minimumOrderAmount.toString(),
        },
      }),
      ...(expiresAt && {
        ends_at: new Date(expiresAt).toISOString(),
      }),
    },
  };

  try {
    // Create the price rule
    const priceRuleResponse = await axios.post(priceRuleUrl, priceRuleData, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
    });

    const priceRuleId = priceRuleResponse.data.price_rule.id;

    // Create the discount code for the price rule
    const discountCodeUrl = `https://${shopDomain}/admin/api/2024-10/price_rules/${priceRuleId}/discount_codes.json`;
    const discountCodeData = {
      discount_code: {
        code: code,
      },
    };

    const discountCodeResponse = await axios.post(
      discountCodeUrl,
      discountCodeData,
      {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      priceRule: priceRuleResponse.data.price_rule,
      discountCode: discountCodeResponse.data.discount_code,
    };
  } catch (error) {
    console.error('Error creating discount code:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.errors?.message ||
      error.response?.data?.error ||
      'Failed to create discount code in Shopify'
    );
  }
}

/**
 * Get all discount codes for a shop with order status
 */
async function getAllDiscountCodes(shopDomain) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;
  
  try {
    // First, get all price rules
    const priceRulesUrl = `https://${shopDomain}/admin/api/2024-10/price_rules.json`;
    const priceRulesResponse = await axios.get(priceRulesUrl, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
      params: {
        limit: 250,
      },
    });

    const priceRules = priceRulesResponse.data.price_rules || [];
    
    // Fetch orders that used discount codes
    let ordersWithDiscounts = [];
    try {
      const ordersUrl = `https://${shopDomain}/admin/api/2024-10/orders.json`;
      const ordersResponse = await axios.get(ordersUrl, {
        headers: {
          'X-Shopify-Access-Token': access_token,
        },
          params: {
          limit: 250,
          status: 'any',
          fields: 'id,name,financial_status,fulfillment_status,created_at,discount_codes,customer,total_line_items_price,subtotal_price,total_price',
        },
      });
      ordersWithDiscounts = ordersResponse.data.orders || [];
    } catch (orderErr) {
      console.error('Error fetching orders:', orderErr);
      // Continue without order data if read_orders scope is not available
    }

    // Create a map of discount codes to orders
    const discountCodeToOrders = {};
    ordersWithDiscounts.forEach(order => {
      if (order.discount_codes && order.discount_codes.length > 0) {
        order.discount_codes.forEach(dc => {
          const code = dc.code.toUpperCase();
          if (!discountCodeToOrders[code]) {
            discountCodeToOrders[code] = [];
          }
          discountCodeToOrders[code].push({
            id: order.id,
            name: order.name,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            created_at: order.created_at,
            customer: order.customer ? {
              first_name: order.customer.first_name || '',
              last_name: order.customer.last_name || '',
            } : null,
            total_before_discount: order.total_line_items_price || order.subtotal_price || '0.00',
            amount_paid: order.total_price || order.subtotal_price || '0.00', // Total after discount
          });
        });
      }
    });

    const discountCodesWithDetails = [];

    // For each price rule, get its discount codes and check usage
    for (const priceRule of priceRules) {
      try {
        const discountCodesUrl = `https://${shopDomain}/admin/api/2024-10/price_rules/${priceRule.id}/discount_codes.json`;
        const discountCodesResponse = await axios.get(discountCodesUrl, {
          headers: {
            'X-Shopify-Access-Token': access_token,
          },
        });

        const discountCodes = discountCodesResponse.data.discount_codes || [];
        
        for (const discountCode of discountCodes) {
          const code = discountCode.code.toUpperCase();
          const orders = discountCodeToOrders[code] || [];
          const usageCount = priceRule.usage_count || 0;
          const usageLimit = priceRule.usage_limit || null;
          
          // Determine status based on orders
          let status = 'Not Redeemed';
          let orderId = null;
          let orderedBy = null;
          let totalBill = null;
          
          if (orders.length > 0) {
            // Get the most recent order
            const latestOrder = orders[orders.length - 1];
            orderId = latestOrder.name;
            
            // Get customer name
            if (latestOrder.customer) {
              const firstName = latestOrder.customer.first_name || '';
              const lastName = latestOrder.customer.last_name || '';
              orderedBy = `${firstName} ${lastName}`.trim() || null;
            }
            
            // Get total before discount
            totalBill = latestOrder.total_before_discount || null;
            
            // Get amount actually paid (after discount)
            const amountPaid = latestOrder.amount_paid || null;
            
            // Determine status based on fulfillment
            if (latestOrder.fulfillment_status === 'fulfilled') {
              status = 'Order Delivered';
            } else if (latestOrder.fulfillment_status === 'partial') {
              status = 'Order Processed';
            } else if (latestOrder.financial_status === 'paid') {
              status = 'Order Processed';
            } else {
              status = 'Redeemed';
            }
          } else if (usageCount > 0) {
            status = usageLimit && usageCount >= usageLimit ? 'Fully Used' : 'Redeemed';
          }

          discountCodesWithDetails.push({
            code: discountCode.code,
            id: discountCode.id,
            price_rule_id: priceRule.id,
            status: status,
            order_id: orderId,
            ordered_by: orderedBy,
            total_bill: totalBill,
            amount_paid: orders.length > 0 ? orders[orders.length - 1].amount_paid : null,
            usage_count: usageCount,
            usage_limit: usageLimit,
            created_at: discountCode.created_at,
            title: priceRule.title,
          });
        }
      } catch (err) {
        console.error(`Error fetching discount codes for price rule ${priceRule.id}:`, err);
        // Continue with other price rules
      }
    }

    return discountCodesWithDetails;
  } catch (error) {
    console.error('Error fetching discount codes:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.errors?.message ||
      'Failed to fetch discount codes from Shopify'
    );
  }
}

module.exports = {
  generatePromoCode,
  createDiscountCode,
  getAllDiscountCodes,
};
