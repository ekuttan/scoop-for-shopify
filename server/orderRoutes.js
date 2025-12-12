const express = require('express');
const { getAllOrders, markCampaignPromiseMet } = require('./orderService');

const router = express.Router();

/**
 * GET /api/orders?shop={shop}
 * Get all orders for a shop with campaign status
 */
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const orders = await getAllOrders(shop);
    res.json({ orders });
  } catch (error) {
    console.error('Error in get orders route:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch orders',
    });
  }
});

/**
 * POST /api/orders/mark-campaign-promise-met
 * Mark an order as campaign promise met and initiate refund
 * Body: { shop, orderId, shopifyOrderId, shouldRestock }
 */
router.post('/mark-campaign-promise-met', async (req, res) => {
  try {
    const { shop, orderId, shopifyOrderId, shouldRestock } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!shopifyOrderId) {
      return res.status(400).json({ error: 'Missing shopifyOrderId parameter' });
    }

    const result = await markCampaignPromiseMet(shop, orderId, shopifyOrderId, shouldRestock === true);
    res.json(result);
  } catch (error) {
    console.error('Error in mark campaign promise met route:', error);
    res.status(500).json({
      error: error.message || 'Failed to mark campaign promise met',
    });
  }
});

module.exports = router;


