const express = require('express');
const { fetchProducts, fetchProductById } = require('./productService');

const router = express.Router();

/**
 * GET /api/products?shop={shop}&limit=50&since_id={id}&search=...
 */
router.get('/', async (req, res) => {
  try {
    const { shop, limit, since_id, search } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const result = await fetchProducts(shop, {
      limit: limit ? parseInt(limit) : 50,
      since_id: since_id ? parseInt(since_id) : null,
      search: search || '',
    });

    res.json(result);
  } catch (error) {
    console.error('Error in products route:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch products',
    });
  }
});

/**
 * GET /api/products/:id?shop={shop}
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const product = await fetchProductById(shop, id);
    res.json({ product });
  } catch (error) {
    console.error('Error in product detail route:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch product',
    });
  }
});

module.exports = router;

