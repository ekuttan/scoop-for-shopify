const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { saveShop, getShop } = require('./database');
const { fetchShopDetails } = require('./shopService');

const router = express.Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_price_rules,read_orders';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CALLBACK_URL = process.env.CALLBACK_URL || `${APP_URL}/auth/callback`;

// In-memory store for OAuth state (cleared after 5 minutes)
const stateStore = new Map();

// Clean up old states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, timestamp] of stateStore.entries()) {
    if (now - timestamp > 5 * 60 * 1000) { // 5 minutes
      stateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Verify HMAC signature from Shopify
 */
function verifyHmac(query) {
  const { hmac, ...params } = query;
  if (!hmac) return false;

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  return generatedHash === hmac;
}

/**
 * Generate a random state string for OAuth
 */
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Step 1: Initiate OAuth flow
 * GET /auth?shop={shop}.myshopify.com
 */
router.get('/', (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  // Clean shop domain - remove any protocol if present
  let cleanShop = shop.trim();
  if (cleanShop.startsWith('http://') || cleanShop.startsWith('https://')) {
    cleanShop = cleanShop.replace(/^https?:\/\//, '');
  }
  // Remove trailing slash if present
  cleanShop = cleanShop.replace(/\/$/, '');

  // Validate shop domain format
  if (!cleanShop.endsWith('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop domain' });
  }

  const state = generateState();
  const redirectUri = CALLBACK_URL;
  const scopes = SHOPIFY_SCOPES;

  const authUrl = `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;

  // Store state in memory with timestamp
  stateStore.set(state, Date.now());

  res.redirect(authUrl);
});

/**
 * Step 2: OAuth callback
 * GET /auth/callback?code=...&shop=...&state=...
 */
router.get('/callback', async (req, res) => {
  const { code, shop, state, hmac } = req.query;

  // Verify HMAC
  if (!verifyHmac(req.query)) {
    return res.status(403).json({ error: 'Invalid HMAC signature' });
  }

  // Verify state against stored state
  if (!state || !stateStore.has(state)) {
    return res.status(403).json({ error: 'Invalid state parameter' });
  }

  // Remove state from store (one-time use)
  stateStore.delete(state);

  if (!code || !shop) {
    return res.status(400).json({ error: 'Missing code or shop parameter' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    // Fetch shop details from Shopify
    let shopData = null;
    try {
      const shopDetails = await axios.get(
        `https://${shop}/admin/api/2024-10/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': access_token,
          },
        }
      );
      shopData = shopDetails.data.shop;
    } catch (error) {
      console.error('Error fetching shop details during OAuth:', error.response?.data || error.message);
      // Continue even if shop details fetch fails
    }

    // Save shop, access token, and shop data to database
    await saveShop(shop, access_token, shopData);

    // Redirect to home page
    res.redirect(`${APP_URL}/`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to complete OAuth flow',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;

