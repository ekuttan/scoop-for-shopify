# Shopify Product Viewer App

A minimal private Shopify app that allows merchants to view their products in a standalone dashboard. Read-only access with `read_products` scope.

## Features

- ✅ Shopify OAuth authentication
- ✅ HMAC signature verification
- ✅ Product listing with pagination
- ✅ Search products by name
- ✅ Secure token storage (encrypted)
- ✅ Standalone app (not embedded)
- ✅ Local development support with ngrok

## Quick Start / Testing

See **[TESTING.md](./TESTING.md)** for a complete step-by-step testing guide.

## Project Structure

```
/shopify-app
  /server          # Express backend
    index.js       # Main server file
    oauth.js       # OAuth flow handling
    productService.js  # Shopify API integration
    productRoutes.js   # Product API routes
    database.js    # Database operations
  /web            # Next.js frontend
    pages/        # Next.js pages
    components/   # React components
  .env           # Environment variables
  package.json   # Root package.json
```

## Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install web dependencies
cd web && npm install && cd ..
```

### 2. Configure Environment

Copy `env.example` to `.env` and fill in your Shopify app credentials:

```bash
cp env.example .env
```

Update `.env` with:
- `SHOPIFY_API_KEY`: Your app's **Client ID** from Shopify Partner Dashboard (this is the API Key)
- `SHOPIFY_API_SECRET`: Your app's **Client Secret** from Shopify Partner Dashboard (this is the API Secret)
- `SHOPIFY_SCOPES`: `read_products` (default)
- `APP_URL`: Your frontend URL (production: `https://shopify.hoomans.dev`, local: your ngrok URL)
- `CALLBACK_URL`: OAuth callback URL (should be your backend URL + `/auth/callback`)
- `ENCRYPTION_KEY`: A secure random key for encrypting access tokens (generate with: `openssl rand -hex 32`)

### 3. Shopify Partner Dashboard Setup

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Create a new app (Custom app)
3. Set the following URLs:

   **For Production:**
   - App URL: `https://shopify.hoomans.dev`
   - Allowed redirection URL(s): `https://shopify.hoomans.dev/auth/callback`

   **For Local Development (with ngrok):**
   - App URL: `https://your-ngrok-url.ngrok.io`
   - Allowed redirection URL(s): `https://your-ngrok-url.ngrok.io/auth/callback`

4. Note your **Client ID** (this is your API Key) and **Client Secret** (this is your API Secret)

## Local Development

### Step 1: Start ngrok

Shopify requires HTTPS for OAuth callbacks. Use ngrok to expose your local server:

```bash
# Install ngrok if you haven't
# brew install ngrok  # macOS
# or download from https://ngrok.com

# Start ngrok tunnel
ngrok http 3000
```

This will give you a URL like: `https://abc123.ngrok.io`

### Step 2: Update .env

Update your `.env` file with the ngrok URL:

```
APP_URL=http://localhost:3001
CALLBACK_URL=https://abc123.ngrok.io/auth/callback
```

**Important Notes:**
- `APP_URL` should point to your frontend (Next.js app on port 3001 for local dev)
- `CALLBACK_URL` should point to your backend OAuth callback endpoint (use ngrok URL)
- In Shopify Partner Dashboard, set:
  - App URL: `http://localhost:3001` (or your ngrok URL if you want to test the full flow)
  - Allowed redirection URL(s): `https://abc123.ngrok.io/auth/callback`

### Step 3: Start the Development Server

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Next.js frontend on `http://localhost:3001`

### Step 4: Access the App

Visit your ngrok URL: `https://abc123.ngrok.io`

## Usage

### Installing the App

1. Visit: `https://your-app-url/auth?shop=your-shop.myshopify.com`
2. Shopify will prompt for authorization
3. After approval, you'll be redirected to the dashboard

### Viewing Products

- Products are displayed in a grid layout
- Use the search bar to filter products by name
- Click "Load More" to paginate through products

## API Endpoints

### Backend (Express)

- `GET /health` - Health check
- `GET /auth?shop={shop}` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `GET /api/products?shop={shop}&limit=50&page=1&search=...` - Fetch products

### Frontend (Next.js)

- `/` - Home page (install form)
- `/dashboard?shop={shop}` - Products dashboard

## Database

The app uses SQLite to store:
- Shop domain
- Encrypted access token
- Installation timestamp

Database file: `./data/shops.db` (created automatically)

## Security Notes

- Access tokens are encrypted before storage
- HMAC verification for all OAuth callbacks
- State parameter validation
- **Important**: Change `ENCRYPTION_KEY` in production to a secure random key

## Production Deployment

1. Deploy backend to your server (e.g., Railway, Render, Heroku)
2. Deploy Next.js frontend (e.g., Vercel, Netlify)
3. Update `.env` with production URLs
4. Update Shopify Partner Dashboard with production URLs
5. Set a secure `ENCRYPTION_KEY` environment variable

## Troubleshooting

### OAuth callback fails

- Ensure your callback URL matches exactly in Shopify Partner Dashboard
- Check that ngrok is running and URL is correct
- Verify HMAC signature is being validated

### Products not loading

- Check that the shop is installed (access token exists in database)
- Verify API credentials are correct
- Check server logs for API errors

### Database errors

- Ensure `data/` directory is writable
- Check file permissions

## License

ISC

