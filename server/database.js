const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/shops.db');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // In production, use a secure key

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Derive a 32-byte key from the encryption key
function getKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt text using AES-256-CBC
 */
function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt text using AES-256-CBC
 */
function decrypt(encrypted) {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Initialize database
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      db.run(
        `CREATE TABLE IF NOT EXISTS shops (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_domain TEXT UNIQUE NOT NULL,
          access_token_encrypted TEXT NOT NULL,
          shop_data TEXT,
          installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) {
            console.error('Error creating table:', err);
            reject(err);
            db.close();
            return;
          }

          // Add shop_data column if it doesn't exist (migration for existing databases)
          db.run(
            `ALTER TABLE shops ADD COLUMN shop_data TEXT`,
            (alterErr) => {
              // Ignore error if column already exists
              if (alterErr && !alterErr.message.includes('duplicate column name')) {
                console.error('Error adding shop_data column:', alterErr);
              }
              console.log('Database initialized successfully');
              resolve();
              db.close();
            }
          );
        }
      );
    });
  });
}

/**
 * Save or update shop and access token
 */
function saveShop(shopDomain, accessToken, shopData = null) {
  return new Promise((resolve, reject) => {
    const encryptedToken = encrypt(accessToken);
    const shopDataJson = shopData ? JSON.stringify(shopData) : null;
    const db = new sqlite3.Database(DB_PATH);

    db.run(
      `INSERT INTO shops (shop_domain, access_token_encrypted, shop_data, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(shop_domain) DO UPDATE SET
         access_token_encrypted = ?,
         shop_data = ?,
         updated_at = CURRENT_TIMESTAMP`,
      [shopDomain, encryptedToken, shopDataJson, encryptedToken, shopDataJson],
      function(err) {
        if (err) {
          console.error('Error saving shop:', err);
          reject(err);
        } else {
          console.log(`Shop ${shopDomain} saved/updated`);
          resolve();
        }
        db.close();
      }
    );
  });
}

/**
 * Get shop and access token
 */
function getShop(shopDomain) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.get(
      'SELECT * FROM shops WHERE shop_domain = ?',
      [shopDomain],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            const decryptedToken = decrypt(row.access_token_encrypted);
            const shopData = row.shop_data ? JSON.parse(row.shop_data) : null;
            resolve({
              shop_domain: row.shop_domain,
              access_token: decryptedToken,
              shop_data: shopData,
              installed_at: row.installed_at,
              updated_at: row.updated_at,
            });
          } catch (decryptErr) {
            console.error('Error decrypting token:', decryptErr);
            reject(decryptErr);
          }
        }
        db.close();
      }
    );
  });
}

/**
 * Get all installed shops
 */
function getAllShops() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.all(
      'SELECT shop_domain, installed_at FROM shops ORDER BY installed_at DESC',
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
        db.close();
      }
    );
  });
}

/**
 * Delete a shop (logout)
 */
function deleteShop(shopDomain) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.run(
      'DELETE FROM shops WHERE shop_domain = ?',
      [shopDomain],
      function(err) {
        if (err) {
          console.error('Error deleting shop:', err);
          reject(err);
        } else {
          console.log(`Shop ${shopDomain} deleted`);
          resolve();
        }
        db.close();
      }
    );
  });
}

module.exports = {
  initDatabase,
  saveShop,
  getShop,
  getAllShops,
  deleteShop,
};

