const express = require('express');
const { createDiscountCode, generatePromoCode, getAllDiscountCodes } = require('./discountService');

const router = express.Router();

/**
 * GET /api/discounts/generate-code
 * Generate a suggested promo code
 */
router.get('/generate-code', (req, res) => {
  try {
    const code = generatePromoCode();
    res.json({ code });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Failed to generate code',
    });
  }
});

/**
 * POST /api/discounts/create
 * Create a discount code in Shopify
 * Body: { shop, code, percentage, minimumOrderAmount, expiresAt, usageLimit }
 */
router.post('/create', async (req, res) => {
  try {
    const { shop, code, percentage, minimumOrderAmount, expiresAt, usageLimit } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!code || !percentage) {
      return res.status(400).json({ error: 'Missing required fields: code and percentage' });
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 1 and 100' });
    }

    const result = await createDiscountCode(shop, {
      code,
      percentage: parseFloat(percentage),
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
      expiresAt: expiresAt || null,
      usageLimit: usageLimit ? parseInt(usageLimit) : 1,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in discount creation route:', error);
    res.status(500).json({
      error: error.message || 'Failed to create discount code',
    });
  }
});

/**
 * GET /api/discounts?shop={shop}
 * Get all discount codes for a shop
 */
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const discountCodes = await getAllDiscountCodes(shop);
    res.json({ discountCodes });
  } catch (error) {
    console.error('Error in get discount codes route:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch discount codes',
    });
  }
});

module.exports = router;

