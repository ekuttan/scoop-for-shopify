const axios = require('axios');
const { getShop } = require('./database');

/**
 * Fetch shop details from Shopify API
 */
async function fetchShopDetails(shopDomain) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;
  const url = `https://${shopDomain}/admin/api/2024-10/shop.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data.shop;
  } catch (error) {
    console.error('Error fetching shop details:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.errors?.message ||
      'Failed to fetch shop details from Shopify'
    );
  }
}

module.exports = {
  fetchShopDetails,
};

