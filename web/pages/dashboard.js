import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import SearchBar from '../components/SearchBar';

export default function Dashboard() {
  const router = useRouter();
  const { shop } = router.query;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastProductId, setLastProductId] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (sinceId = null, search = '') => {
    if (!shop) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/products', {
        params: {
          shop,
          limit: 20,
          since_id: sinceId,
          search,
        },
      });

      if (sinceId === null) {
        // First page or search reset
        setProducts(response.data.products || []);
      } else {
        // Load more - append to existing products
        setProducts((prev) => [...prev, ...(response.data.products || [])]);
      }

      // Update pagination state
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
    if (shop) {
      // Reset pagination when shop or search changes
      setLastProductId(null);
      setHasMore(true);
      fetchProducts(null, searchTerm);
    }
  }, [shop, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setLastProductId(null);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (lastProductId && hasMore) {
      fetchProducts(lastProductId, searchTerm);
    }
  };

  if (!shop) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No shop parameter provided</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Products Dashboard</h1>
        <p style={styles.shopName}>{shop}</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {error && (
        <div style={styles.error}>
          {error}
          {error.includes('not found') && (
            <div style={styles.installLink}>
              <a href={`/auth?shop=${encodeURIComponent(shop)}`}>
                Install App
              </a>
            </div>
          )}
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
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  shopName: {
    fontSize: '16px',
    color: '#666',
  },
  error: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
  },
  installLink: {
    marginTop: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  loadMoreContainer: {
    textAlign: 'center',
    marginTop: '30px',
    marginBottom: '30px',
  },
  loadMoreButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#5e6ad2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

