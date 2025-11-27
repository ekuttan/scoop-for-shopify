# Testing Guide

This guide will walk you through testing your Shopify app locally.

## Prerequisites

1. ✅ Node.js installed
2. ✅ ngrok installed and authenticated
3. ✅ Shopify Partner account
4. ✅ Development store (or access to a test store)

## Step-by-Step Testing

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install web dependencies
cd web && npm install && cd ..
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example env file
cp env.example .env
```

Edit `.env` and add your Shopify credentials:

```bash
# Get these from Shopify Partner Dashboard > Your App > Client credentials
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOPIFY_SCOPES=read_products

# For local development
APP_URL=http://localhost:3001
PORT=3000
DB_PATH=./data/shops.db

# Generate a secure encryption key
ENCRYPTION_KEY=your-secure-random-key-here
```

**Generate encryption key:**
```bash
openssl rand -hex 32
```

### Step 3: Start ngrok

In a **separate terminal**, start ngrok:

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 4: Update .env with ngrok URL

Edit your `.env` file and update:

```bash
CALLBACK_URL=https://abc123.ngrok.io/auth/callback
```

### Step 5: Configure Shopify Partner Dashboard

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Select your app
3. Go to **App setup** tab
4. Under **App URL**, enter: `http://localhost:3001`
5. Under **Allowed redirection URL(s)**, click **Add URL** and enter: `https://abc123.ngrok.io/auth/callback`
6. **Save** the changes

### Step 6: Start the Development Servers

In your main terminal:

```bash
npm run dev
```

This starts:
- ✅ Backend server on `http://localhost:3000`
- ✅ Next.js frontend on `http://localhost:3001`

You should see:
```
Server running on http://localhost:3000
Database initialized successfully
```

### Step 7: Test the Installation Flow

1. **Open your browser** and go to: `http://localhost:3001`

2. **You should see** the installation form with:
   - Title: "Shopify Product Viewer"
   - Input field for shop domain
   - "Install App" button

3. **Enter your shop domain** (e.g., `your-shop.myshopify.com`)

4. **Click "Install App"**

5. **You'll be redirected** to Shopify's OAuth page asking for permission

6. **Click "Install"** to approve

7. **You'll be redirected back** to your dashboard at: `http://localhost:3001/dashboard?shop=your-shop.myshopify.com`

### Step 8: Verify Products Are Loading

On the dashboard page, you should see:

- ✅ Shop name displayed at the top
- ✅ Search bar
- ✅ Grid of products with:
  - Product images
  - Product titles
  - Status badges
  - Variant counts
  - Prices

### Step 9: Test Search Functionality

1. Type a product name in the search bar
2. Click "Search"
3. Products should filter to match your search term
4. Click "Clear" to reset

### Step 10: Test Pagination

1. Scroll down to see if there are more products
2. Click "Load More" button
3. More products should load

## Troubleshooting

### OAuth Callback Fails

**Error:** "Invalid HMAC signature" or callback not working

**Solutions:**
- ✅ Verify `CALLBACK_URL` in `.env` matches exactly what's in Shopify Partner Dashboard
- ✅ Make sure ngrok is still running
- ✅ Check that the ngrok URL hasn't changed (restart ngrok = new URL)
- ✅ Verify `SHOPIFY_API_SECRET` is correct in `.env`

### Products Not Loading

**Error:** "Shop not found" or "Failed to fetch products"

**Solutions:**
- ✅ Check that OAuth completed successfully (check `data/shops.db` exists)
- ✅ Verify the shop domain is correct
- ✅ Check server logs for API errors
- ✅ Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct

### Database Errors

**Error:** "Error opening database" or permission errors

**Solutions:**
- ✅ Check that `data/` directory exists and is writable
- ✅ Verify `DB_PATH` in `.env` is correct
- ✅ Try deleting `data/shops.db` and restarting (will require re-installation)

### ngrok URL Changed

**Problem:** ngrok URL changes every time you restart it

**Solutions:**
- ✅ Update `CALLBACK_URL` in `.env` with new ngrok URL
- ✅ Update "Allowed redirection URL(s)" in Shopify Partner Dashboard
- ✅ Consider ngrok paid plan for fixed domain

## Testing Checklist

- [ ] Dependencies installed
- [ ] `.env` file configured with credentials
- [ ] ngrok running and URL copied
- [ ] Shopify Partner Dashboard configured
- [ ] Servers started successfully
- [ ] Can access home page at `http://localhost:3001`
- [ ] OAuth flow completes successfully
- [ ] Redirected to dashboard after OAuth
- [ ] Products display correctly
- [ ] Search functionality works
- [ ] Pagination works (if you have many products)

## Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:3000/health

# Check if database was created
ls -la data/

# View server logs for errors
# (check the terminal where npm run dev is running)

# Test API endpoint directly (after installation)
curl "http://localhost:3000/api/products?shop=your-shop.myshopify.com"
```

## Next Steps

Once testing is successful:
1. Deploy to production
2. Update production URLs in `.env`
3. Update Shopify Partner Dashboard with production URLs
4. Generate a secure `ENCRYPTION_KEY` for production

