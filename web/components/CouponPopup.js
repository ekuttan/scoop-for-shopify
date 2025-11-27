import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CouponPopup({ shop, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [error, setError] = useState(null);

  // Generate code on mount
  useEffect(() => {
    generateCode();
  }, []);

  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await axios.get('/api/discounts/generate-code');
      setCode(response.data.code);
    } catch (err) {
      console.error('Error generating code:', err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || !percentage) {
      setError('Code and percentage are required');
      return;
    }

    if (percentage < 1 || percentage > 100) {
      setError('Percentage must be between 1 and 100');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/discounts/create', {
        shop,
        code,
        percentage: parseFloat(percentage),
        minimumOrderAmount: minimumOrder ? parseFloat(minimumOrder) : null,
        expiresAt: expiresAt || null,
        usageLimit: 1, // One-time use by default
      });

      // Copy code to clipboard
      try {
        await navigator.clipboard.writeText(code);
      } catch (clipboardErr) {
        console.error('Failed to copy to clipboard:', clipboardErr);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        }
        document.body.removeChild(textArea);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Error creating discount:', err);
      setError(err.response?.data?.error || 'Failed to create discount code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Generate Coupon Code</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>
              Promo Code *
            </label>
            <div style={styles.codeInputContainer}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter or generate code"
                style={styles.codeInput}
                required
                maxLength={20}
              />
              <button
                type="button"
                onClick={generateCode}
                disabled={generatingCode}
                style={styles.generateIconButton}
                title={generatingCode ? 'Generating...' : 'Generate new code'}
              >
                {generatingCode ? '⟳' : '↻'}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Discount Percentage *
            </label>
            <div style={styles.percentageInput}>
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="10"
                style={styles.input}
                min="1"
                max="100"
                required
              />
              <span style={styles.percent}>%</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Minimum Order Amount (optional)
            </label>
            <div style={styles.currencyInput}>
              <span style={styles.currency}>$</span>
              <input
                type="number"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(e.target.value)}
                placeholder="0.00"
                style={styles.currencyInputInput}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Expiration Date (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading || !code || !percentage}
            >
              {loading ? 'Creating...' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  popup: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
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
  },
  form: {
    padding: '20px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
  },
  codeInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    padding: '10px 40px 10px 10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  generateIconButton: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  percentageInput: {
    position: 'relative',
  },
  percent: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    fontSize: '16px',
  },
  currencyInput: {
    position: 'relative',
  },
  currencyInputInput: {
    width: '100%',
    padding: '10px 10px 10px 28px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  currency: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    fontSize: '16px',
    fontWeight: '600',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    marginBottom: '20px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
  },
  submitButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
  },
};

