import { useState } from 'react';
import JsonViewer from './JsonViewer';

export default function ProductList({ products }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hoveredImageId, setHoveredImageId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  if (products.length === 0) {
    return (
      <div style={styles.empty}>
        No products found. Try adjusting your search.
      </div>
    );
  }

  const getPriceInfo = (product) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    const variant = product.variants[0];
    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
    const isOnSale = compareAtPrice && compareAtPrice > price;
    
    return { price, compareAtPrice, isOnSale };
  };


  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseSidebar = () => {
    setSelectedProduct(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {products.map((product) => {
          const priceInfo = getPriceInfo(product);
          
          // Convert title to sentence case
          const toSentenceCase = (str) => {
            return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
          };

          return (
            <div
              key={product.id}
              style={styles.card}
              onClick={() => handleProductClick(product)}
              onMouseEnter={() => {
                setHoveredCardId(product.id);
                setHoveredImageId(product.id);
              }}
              onMouseLeave={() => {
                setHoveredCardId(null);
                setHoveredImageId(null);
              }}
            >
              <div style={styles.imageContainer}>
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0].src}
                    alt={product.title}
                    style={{
                      ...styles.image,
                      transform: hoveredImageId === product.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                )}
              </div>
              <div 
                style={{
                  ...styles.content,
                  opacity: hoveredCardId === product.id ? 1 : 0,
                }}
              >
                <h3 style={styles.title}>{toSentenceCase(product.title)}</h3>
                {priceInfo && (
                  <div style={styles.priceContainer}>
                    <span style={styles.price}>
                      ₹{priceInfo.price.toFixed(2)}
                    </span>
                    {priceInfo.isOnSale && (
                      <span style={styles.originalPrice}>
                        ₹{priceInfo.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedProduct && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            <button style={styles.closeButton} onClick={handleCloseSidebar}>×</button>
            <JsonViewer data={selectedProduct} />
          </div>
        </div>
      )}
      {selectedProduct && (
        <div style={styles.sidebarOverlay} onClick={handleCloseSidebar} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '30px',
    padding: '0 20px',
    justifyContent: 'center',
    placeItems: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  sidebarOverlay: {
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
  sidebarContent: {
    flex: 1,
    overflow: 'auto',
    padding: '40px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '250px',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%', // Square aspect ratio
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  content: {
    padding: '15px 0 0 0',
    textAlign: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  title: {
    fontSize: '14px',
    fontWeight: '400',
    margin: '0 0 8px 0',
    color: '#000',
    letterSpacing: '0.5px',
    lineHeight: '1.4',
    textAlign: 'center',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    justifyContent: 'center',
  },
  price: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#000',
  },
  originalPrice: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#999',
    textDecoration: 'line-through',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '16px',
  },
};

