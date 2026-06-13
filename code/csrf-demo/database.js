const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.sql');
let db;

function initDb() {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) return reject(err);
      db.exec(schema, (execErr) => {
        if (execErr) return reject(execErr);
        resolve();
      });
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createUser({ fullName, email, username, password }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (fullName, email, username, password, balance) VALUES (?, ?, ?, ?, ?)',
      [fullName || null, email, username, password, 10000],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function updateEmail(userId, email) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET email = ? WHERE id = ?', [email, userId], function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function transferFunds(fromId, toUsername, amount) {
  amount = parseInt(amount, 10);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get('SELECT id, balance FROM users WHERE id = ?', [fromId], (err, fromRow) => {
        if (err) return reject(err);
        if (!fromRow) return resolve({ success: false, error: 'Sender not found' });
        if (fromRow.balance < amount) return resolve({ success: false, error: 'Insufficient balance' });

        db.get('SELECT id, balance FROM users WHERE username = ?', [toUsername], (err2, toRow) => {
          if (err2) return reject(err2);
          if (!toRow) return resolve({ success: false, error: 'Recipient not found' });

          db.run('BEGIN TRANSACTION');
          db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, fromId], function (uErr) {
            if (uErr) return db.run('ROLLBACK', () => reject(uErr));
            db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, toRow.id], function (uErr2) {
              if (uErr2) return db.run('ROLLBACK', () => reject(uErr2));
              db.run('COMMIT', (cErr) => {
                if (cErr) return reject(cErr);
                resolve({ success: true });
              });
            });
          });
        });
      });
    });
  });
}

module.exports = {
  initDb,
  getUserByUsername,
  getUserById,
  createUser,
  updateEmail,
  transferFunds
};


