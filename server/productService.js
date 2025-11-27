const axios = require('axios');
const { getShop } = require('./database');

/**
 * Fetch products from Shopify API
 * Uses cursor-based pagination with since_id
 */
async function fetchProducts(shopDomain, options = {}) {
  const { limit = 50, since_id = null, search = '' } = options;

  // Get shop and access token from database
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;
  const url = `https://${shopDomain}/admin/api/2024-10/products.json`;

  const params = {
    limit: Math.min(limit, 250), // Shopify max is 250 per request
  };

  // Use since_id for cursor-based pagination
  if (since_id) {
    params.since_id = since_id;
  }

  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    let products = response.data.products || [];

    // Filter by search term if provided (client-side filtering)
    // Note: Shopify REST API doesn't support title search parameter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.title.toLowerCase().includes(searchLower)
      );
    }

    // Get the last product ID for pagination
    const lastProductId = products.length > 0 ? products[products.length - 1].id : null;
    const hasMore = products.length === params.limit; // If we got the full limit, there might be more

    return {
      products,
      lastProductId,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.errors?.message ||
      'Failed to fetch products from Shopify'
    );
  }
}

/**
 * Fetch a single product by ID
 */
async function fetchProductById(shopDomain, productId) {
  const shop = await getShop(shopDomain);
  if (!shop) {
    throw new Error('Shop not found. Please install the app first.');
  }

  const { access_token } = shop;
  const url = `https://${shopDomain}/admin/api/2024-10/products/${productId}.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data.product;
  } catch (error) {
    console.error('Error fetching product:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.errors?.message ||
      'Failed to fetch product from Shopify'
    );
  }
}

module.exports = {
  fetchProducts,
  fetchProductById,
};

