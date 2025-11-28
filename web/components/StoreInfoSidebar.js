import { useState, useEffect } from 'react';
import axios from 'axios';
import JsonViewer from './JsonViewer';

export default function StoreInfoSidebar({ shop, onClose }) {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shop) {
      fetchShopData();
    }
  }, [shop]);

  const fetchShopData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/shop/${encodeURIComponent(shop)}`);
      setShopData(response.data.shop);
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError(err.response?.data?.error || 'Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.sidebar}>
        <div style={styles.content}>
          <button style={styles.closeButton} onClick={onClose}>×</button>
          {loading ? (
            <div style={styles.loading}>Loading store information...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : shopData && Object.keys(shopData).length > 0 ? (
            <JsonViewer data={shopData} />
          ) : (
            <div style={styles.error}>No store information available</div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '600px',
    height: '100vh',
    backgroundColor: '#fff',
    borderLeft: '1px solid #ddd',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#999',
    lineHeight: '1',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '40px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '14px',
  },
  error: {
    padding: '15px',
    backgroundColor: '#fff',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
  },
};

