import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrdersList({ shop, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [restockCheckboxes, setRestockCheckboxes] = useState({});

  useEffect(() => {
    if (shop) {
      fetchOrders();
    }
  }, [shop]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/orders', {
        params: { shop },
      });
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCampaignPromiseMet = async (orderId, shopifyOrderId) => {
    const shouldRestock = restockCheckboxes[orderId] || false;
    const confirmMessage = shouldRestock
      ? 'Mark this order as campaign promise met, initiate refund, and restock products?'
      : 'Mark this order as campaign promise met and initiate refund?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessingRefund(orderId);
    try {
      const response = await axios.post('/api/orders/mark-campaign-promise-met', {
        shop,
        orderId,
        shopifyOrderId,
        shouldRestock,
      });
      
      // Clear the checkbox state for this order
      setRestockCheckboxes(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      
      // Refresh orders list
      await fetchOrders();
      
      const successMessage = shouldRestock
        ? 'Order marked as campaign promise met. Refund initiated. Restock in progress.'
        : 'Order marked as campaign promise met. Refund initiated.';
      alert(successMessage);
    } catch (err) {
      console.error('Error marking campaign promise met:', err);
      alert(err.response?.data?.error || 'Failed to mark campaign promise met');
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleRestockCheckboxChange = (orderId, checked) => {
    setRestockCheckboxes(prev => ({
      ...prev,
      [orderId]: checked,
    }));
  };

  const getStatusColor = (status, restockStatus) => {
    // If there's a restock status, use restock colors
    if (restockStatus) {
      const restockColors = {
        'Restock Pending': '#FFF9C4', // Light yellow
        'Restocked': '#C8E6C9', // Light green
        'Restock Failed': '#FFCDD2', // Light red
      };
      return restockColors[restockStatus] || '#F5F5F5';
    }
    
    const statusColors = {
      'Not Redeemed': '#F5F5F5', // Light grey
      'Redeemed': '#FFF3E0', // Light orange
      'Fully Used': '#FCE4EC', // Light pink
      'Order Processed': '#E3F2FD', // Light blue
      'Order Delivered': '#E8F5E9', // Light green
    };
    return statusColors[status] || '#F5F5F5'; // Default light gray
  };

  const getStatusTextColor = (status, restockStatus) => {
    // If there's a restock status, use restock colors
    if (restockStatus) {
      const restockTextColors = {
        'Restock Pending': '#F57F17', // Dark yellow
        'Restocked': '#2E7D32', // Dark green
        'Restock Failed': '#C62828', // Dark red
      };
      return restockTextColors[restockStatus] || '#666';
    }
    
    const textColors = {
      'Not Redeemed': '#666', // Dark grey
      'Redeemed': '#F57C00', // Dark orange
      'Fully Used': '#C2185B', // Dark pink
      'Order Processed': '#1976D2', // Dark blue
      'Order Delivered': '#2E7D32', // Dark green
    };
    return textColors[status] || '#666'; // Default dark gray
  };

  const getDisplayStatus = (status, restockStatus) => {
    if (restockStatus) {
      return restockStatus;
    }
    return status;
  };

  const getCampaignStatusColor = (status) => {
    const statusColors = {
      'Campaign Promise Met': '#FFF3E0', // Light orange
      'Campaign Completed': '#E8F5E9', // Light green
    };
    return statusColors[status] || '#F5F5F5';
  };

  const getCampaignStatusTextColor = (status) => {
    const textColors = {
      'Campaign Promise Met': '#F57C00', // Dark orange
      'Campaign Completed': '#2E7D32', // Dark green
    };
    return textColors[status] || '#666';
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.sidebar}>
        <div style={styles.content}>
          <button style={styles.closeButton} onClick={onClose}>×</button>
          {loading ? (
            <div style={styles.loading}>Loading orders...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : orders.length === 0 ? (
            <div style={styles.empty}>No orders found</div>
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
                  <th style={styles.th}>Campaign Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.td}>{order.code}</td>
                    <td style={styles.td}>{order.order_id || '-'}</td>
                    <td style={styles.td}>{order.ordered_by || '-'}</td>
                    <td style={styles.td}>
                      {order.total_bill ? `₹${parseFloat(order.total_bill).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      {order.amount_paid ? `₹${parseFloat(order.amount_paid).toFixed(2)}` : '-'}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusCapsule,
                          backgroundColor: getStatusColor(order.status, order.restock_status),
                          color: getStatusTextColor(order.status, order.restock_status),
                        }}
                      >
                        {getDisplayStatus(order.status, order.restock_status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {order.campaign_status ? (
                        <span
                          style={{
                            ...styles.statusCapsule,
                            backgroundColor: getCampaignStatusColor(order.campaign_status),
                            color: getCampaignStatusTextColor(order.campaign_status),
                          }}
                        >
                          {order.campaign_status}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={styles.td}>
                      {order.status === 'Order Delivered' && 
                       order.campaign_status !== 'Campaign Promise Met' && 
                       order.campaign_status !== 'Campaign Completed' && 
                       order.shopify_order_id ? (
                        <div style={styles.actionContainer}>
                          <label style={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={restockCheckboxes[order.id] || false}
                              onChange={(e) => handleRestockCheckboxChange(order.id, e.target.checked)}
                              disabled={processingRefund === order.id}
                              style={styles.checkbox}
                            />
                            <span style={styles.checkboxText}>Collect product as return</span>
                          </label>
                          <button
                            onClick={() => handleMarkCampaignPromiseMet(order.id, order.shopify_order_id)}
                            disabled={processingRefund === order.id}
                            style={styles.actionButton}
                          >
                            {processingRefund === order.id ? 'Processing...' : 'Mark Campaign Promise Met'}
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
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
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
    marginTop: '8px',
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    cursor: 'pointer',
  },
  checkboxText: {
    color: '#666',
  },
};


