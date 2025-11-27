import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import CouponPopup from '../components/CouponPopup';
import StoreInfoSidebar from '../components/StoreInfoSidebar';
import CouponsList from '../components/CouponsList';

export default function Home() {
  const router = useRouter();
  const [shop, setShop] = useState('');
  const [installedShop, setInstalledShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastProductId, setLastProductId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const [showCouponsList, setShowCouponsList] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check for installed shop on mount
  useEffect(() => {
    checkInstalledShop();
  }, []);

  const checkInstalledShop = async () => {
    try {
      const response = await axios.get('/api/shops');
      const shops = response.data.shops || [];
      if (shops.length > 0) {
        const firstShop = shops[0].shop_domain;
        setInstalledShop(firstShop);
        fetchProducts(null, firstShop);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking installed shops:', err);
      setLoading(false);
    }
  };

  const fetchProducts = async (sinceId = null, shopDomain = installedShop) => {
    if (!shopDomain) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/products', {
        params: {
          shop: shopDomain,
          limit: 20,
          since_id: sinceId,
        },
      });

      if (sinceId === null) {
        setProducts(response.data.products || []);
      } else {
        setProducts((prev) => [...prev, ...(response.data.products || [])]);
      }

      setLastProductId(response.data.lastProductId || null);
      setHasMore(response.data.hasMore || false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (installedShop) {
      setLastProductId(null);
      setHasMore(true);
      fetchProducts(null, installedShop);
    }
  }, [installedShop]);

  const handleInstall = (e) => {
    e.preventDefault();
    if (!shop) {
      alert('Please enter a shop domain');
      return;
    }

    let shopDomain = shop.trim();
    if (!shopDomain.endsWith('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    window.location.href = `/auth?shop=${encodeURIComponent(shopDomain)}`;
  };

  const handleLoadMore = () => {
    if (lastProductId && hasMore) {
      fetchProducts(lastProductId, installedShop);
    }
  };

  const handleCouponSuccess = (data) => {
    setSuccessMessage(`Coupon code "${data.discountCode.code}" created successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleLogout = async () => {
    if (!installedShop) return;
    
    if (confirm('Are you sure you want to logout? You will need to re-install the app.')) {
      try {
        await axios.delete(`/api/shops/${encodeURIComponent(installedShop)}`);
        setInstalledShop(null);
        setProducts([]);
        setLastProductId(null);
        setHasMore(true);
      } catch (err) {
        console.error('Error logging out:', err);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  // Show install form if no shop is installed
  if (!installedShop && !loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Shopify Product Viewer</h1>
          <p style={styles.subtitle}>Connect your Shopify store to view products</p>

          <form onSubmit={handleInstall} style={styles.form}>
            <input
              type="text"
              placeholder="your-shop.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Install App
            </button>
          </form>

          <p style={styles.helpText}>
            Enter your Shopify store domain to begin the installation process.
          </p>
        </div>
      </div>
    );
  }

  // Show products if shop is installed
  return (
    <div style={styles.container}>
      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading && products.length === 0 ? (
        <div style={styles.loading}>Loading products...</div>
      ) : (
        <>
          <ProductList products={products} />
          {hasMore && !loading && (
            <div style={styles.loadMoreContainer}>
              <button onClick={handleLoadMore} style={styles.loadMoreButton}>
                Load More
              </button>
            </div>
          )}
          {loading && products.length > 0 && (
            <div style={styles.loading}>Loading more...</div>
          )}
        </>
      )}

      <div style={styles.footer}>
        <div style={styles.footerButtons}>
          <button
            onClick={() => setShowCouponPopup(true)}
            style={styles.footerButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.textDecorationStyle = 'dotted';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Generate Coupon Code
          </button>
          <button
            onClick={() => setShowCouponsList(true)}
            style={styles.footerButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.textDecorationStyle = 'dotted';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            All Coupons
          </button>
          <button
            onClick={handleLogout}
            style={styles.footerButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.textDecorationStyle = 'dotted';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Logout
          </button>
        </div>
        <div
          style={styles.footerText}
          onClick={() => setShowStoreInfo(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
            e.currentTarget.style.textDecorationStyle = 'dotted';
            e.currentTarget.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {installedShop}
        </div>
      </div>

      {showCouponPopup && (
        <CouponPopup
          shop={installedShop}
          onClose={() => setShowCouponPopup(false)}
          onSuccess={handleCouponSuccess}
        />
      )}

      {showStoreInfo && (
        <StoreInfoSidebar
          shop={installedShop}
          onClose={() => setShowStoreInfo(false)}
        />
      )}

      {showCouponsList && (
        <CouponsList
          shop={installedShop}
          onClose={() => setShowCouponsList(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    padding: '40px 20px',
    paddingBottom: '120px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto',
    border: '1px solid #000',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #000',
    outline: 'none',
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center',
  },
  helpText: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: '20px',
    textAlign: 'center',
  },
  footerButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '10px',
  },
  footerButton: {
    padding: 0,
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
    textDecoration: 'none',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  successMessage: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    padding: '15px',
    backgroundColor: '#fff',
    border: '1px solid #000',
    color: '#000',
    textAlign: 'center',
    fontSize: '14px',
  },
  error: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #c33',
    color: '#c33',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '14px',
  },
  loadMoreContainer: {
    textAlign: 'center',
    marginTop: '40px',
    marginBottom: '40px',
  },
  loadMoreButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
  },
};


