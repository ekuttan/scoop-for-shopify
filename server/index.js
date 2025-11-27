require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const oauthRoutes = require('./oauth');
const productRoutes = require('./productRoutes');
const discountRoutes = require('./discountRoutes');
const { initDatabase, getAllShops, deleteShop, getShop } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3001',
  credentials: true,
}));

// Initialize database
initDatabase();

// Routes
app.use('/auth', oauthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/discounts', discountRoutes);

// Get installed shops
app.get('/api/shops', async (req, res) => {
  try {
    const shops = await getAllShops();
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to get shops' });
  }
});

// Get shop details
app.get('/api/shop/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    const shopRecord = await getShop(shop);
    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    // If shop_data exists, return it
    if (shopRecord.shop_data) {
      return res.json({ shop: shopRecord.shop_data });
    }
    
    // If shop_data doesn't exist, fetch it from Shopify
    const { fetchShopDetails } = require('./shopService');
    try {
      const shopData = await fetchShopDetails(shop);
      // Update the database with fetched shop data
      const { saveShop } = require('./database');
      await saveShop(shop, shopRecord.access_token, shopData);
      res.json({ shop: shopData });
    } catch (fetchError) {
      console.error('Error fetching shop details:', fetchError);
      res.json({ shop: null });
    }
  } catch (error) {
    console.error('Error in shop endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to get shop details' });
  }
});

// Logout (delete shop)
app.delete('/api/shops/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    await deleteShop(shop);
    res.json({ success: true, message: 'Shop logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to logout' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure to set up ngrok for local development:`);
  console.log(`  ngrok http ${PORT}`);
});

