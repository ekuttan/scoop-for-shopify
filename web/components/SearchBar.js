import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Optional: debounce for real-time search
    // For now, search on Enter or button click
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={handleChange}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onSearch('');
            }}
            style={styles.clearButton}
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    padding: '0 20px',
  },
  form: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
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
  clearButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontWeight: '400',
    letterSpacing: '0.5px',
  },
};

