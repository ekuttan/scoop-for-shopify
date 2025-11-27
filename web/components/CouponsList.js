import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CouponsList({ shop, onClose }) {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shop) {
      fetchDiscountCodes();
    }
  }, [shop]);

  const fetchDiscountCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/discounts', {
        params: { shop },
      });
      setDiscountCodes(response.data.discountCodes || []);
    } catch (err) {
      console.error('Error fetching discount codes:', err);
      setError(err.response?.data?.error || 'Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Not Redeemed': '#F5F5F5', // Light grey
      'Redeemed': '#FFF3E0', // Light orange
      'Fully Used': '#FCE4EC', // Light pink
      'Order Processed': '#E3F2FD', // Light blue
      'Order Delivered': '#E8F5E9', // Light green
    };
    return statusColors[status] || '#F5F5F5'; // Default light gray
  };

  const getStatusTextColor = (status) => {
    const textColors = {
      'Not Redeemed': '#666', // Dark grey
      'Redeemed': '#F57C00', // Dark orange
      'Fully Used': '#C2185B', // Dark pink
      'Order Processed': '#1976D2', // Dark blue
      'Order Delivered': '#2E7D32', // Dark green
    };
    return textColors[status] || '#666'; // Default dark gray
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.sidebar}>
        <div style={styles.content}>
          <button style={styles.closeButton} onClick={onClose}>×</button>
          {loading ? (
            <div style={styles.loading}>Loading coupons...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : discountCodes.length === 0 ? (
            <div style={styles.empty}>No coupons found</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Ordered by</th>
                  <th style={styles.th}>Total bill</th>
                  <th style={styles.th}>Amount paid</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map((discount) => (
                  <tr key={discount.id} style={styles.tr}>
                    <td style={styles.td}>{discount.code}</td>
                    <td style={styles.td}>{discount.order_id || '-'}</td>
                    <td style={styles.td}>{discount.ordered_by || '-'}</td>
                    <td style={styles.td}>
                      {discount.total_bill ? `₹${parseFloat(discount.total_bill).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {discount.amount_paid ? `₹${parseFloat(discount.amount_paid).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusCapsule,
                          backgroundColor: getStatusColor(discount.status),
                          color: getStatusTextColor(discount.status),
                        }}
                      >
                        {discount.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    width: '1200px',
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
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: 'none',
  },
  tr: {
    borderBottom: 'none',
  },
  td: {
    padding: '12px 0',
    fontSize: '14px',
    color: '#000',
    borderBottom: 'none',
  },
  statusCapsule: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
};

