import { useState, useEffect } from 'react';
import axios from 'axios';

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
        <div style={styles.header}>
          <h2 style={styles.title}>Store Information</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading store information...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : shopData && Object.keys(shopData).length > 0 ? (
            <div style={styles.info}>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Store Name:</strong>
                <span style={styles.infoValue}>{shopData.name || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Domain:</strong>
                <span style={styles.infoValue}>{shopData.domain || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Email:</strong>
                <span style={styles.infoValue}>{shopData.email || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Phone:</strong>
                <span style={styles.infoValue}>{shopData.phone || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Currency:</strong>
                <span style={styles.infoValue}>{shopData.currency || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Timezone:</strong>
                <span style={styles.infoValue}>{shopData.timezone || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <strong style={styles.infoLabel}>Plan:</strong>
                <span style={styles.infoValue}>{shopData.plan_name || 'N/A'}</span>
              </div>
              {shopData.address1 && (
                <div style={styles.infoRow}>
                  <strong style={styles.infoLabel}>Address:</strong>
                  <span style={styles.infoValue}>
                    {shopData.address1}
                    {shopData.address2 ? `, ${shopData.address2}` : ''}
                    {shopData.city ? `, ${shopData.city}` : ''}
                    {shopData.province ? `, ${shopData.province}` : ''}
                    {shopData.zip ? ` ${shopData.zip}` : ''}
                    {shopData.country ? `, ${shopData.country}` : ''}
                  </span>
                </div>
              )}
              {shopData.description && (
                <div style={styles.infoSection}>
                  <strong style={styles.infoLabel}>Description:</strong>
                  <p style={styles.description}>{shopData.description}</p>
                </div>
              )}
            </div>
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
    width: '400px',
    height: '100vh',
    backgroundColor: '#fff',
    borderLeft: '1px solid #ddd',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  title: {
    fontSize: '18px',
    fontWeight: '400',
    margin: 0,
    color: '#000',
    letterSpacing: '0.5px',
  },
  closeButton: {
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
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
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
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  infoLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '14px',
    color: '#000',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#000',
    lineHeight: '1.6',
    margin: 0,
  },
};

