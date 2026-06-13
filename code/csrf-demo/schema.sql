DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 10000,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (fullName, email, username, password, balance)
VALUES ('User One', 'user1@example.com', 'user1', 'pass123', 10000);
