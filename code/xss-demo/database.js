const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shopping.db');

// Function to reset/refresh database
function resetDatabase() {
    return new Promise((resolve, reject) => {
        // Delete existing database file if it exists
        if (fs.existsSync(dbPath)) {
            try {
                fs.unlinkSync(dbPath);
                console.log('🗑️  Existing database deleted');
            } catch (err) {
                console.error('Error deleting database:', err);
                reject(err);
                return;
            }
        }

        // Create new database connection
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error creating database:', err);
                reject(err);
                return;
            }
            console.log('✅ New database created');
            resolve(db);
        });
    });
}

// Initialize database with fresh data
function initializeDatabase() {
    return new Promise(async (resolve, reject) => {
        try {
            // Reset database - delete and recreate
            const db = await resetDatabase();
            
            db.serialize(() => {
                // Create items table
                db.run(`
                    CREATE TABLE IF NOT EXISTS items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        slug TEXT UNIQUE NOT NULL,
                        description TEXT,
                        price DECIMAL(10, 2) NOT NULL,
                        category TEXT,
                        image_url TEXT,
                        stock INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating items table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Items table created');
                });

                // Create comments table
                db.run(`
                    CREATE TABLE IF NOT EXISTS comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        item_id INTEGER NOT NULL,
                        username TEXT NOT NULL,
                        comment TEXT NOT NULL,
                        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating comments table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Comments table created');
                });

                // Insert fresh sample data
                console.log('📦 Inserting fresh sample data...');
                
                const sampleItems = [
                    {
                        name: 'Wireless Headphones',
                        slug: 'wireless-headphones',
                        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for travel and daily use.',
                        price: 79.99,
                        category: 'Electronics',
                        image_url: '/images/headphones.jpg',
                        stock: 50
                    },
                    {
                        name: 'Smart Watch',
                        slug: 'smart-watch',
                        description: 'Fitness tracker with heart rate monitor, GPS, and 7-day battery life. Track your health and stay connected.',
                        price: 199.99,
                        category: 'Wearables',
                        image_url: '/images/smartwatch.jpg',
                        stock: 30
                    },
                    {
                        name: 'Backpack',
                        slug: 'backpack',
                        description: 'Waterproof backpack with laptop compartment and multiple pockets. Ideal for work, school, or travel.',
                        price: 49.99,
                        category: 'Accessories',
                        image_url: '/images/backpack.jpg',
                        stock: 100
                    },
                    {
                        name: 'Coffee Maker',
                        slug: 'coffee-maker',
                        description: 'Programmable coffee maker with thermal carafe and brew strength control. Start your day with perfect coffee.',
                        price: 89.99,
                        category: 'Home & Kitchen',
                        image_url: '/images/coffeemaker.jpg',
                        stock: 25
                    },
                    {
                        name: 'Running Shoes',
                        slug: 'running-shoes',
                        description: 'Lightweight running shoes with cushioned sole and breathable mesh upper. Designed for comfort and performance.',
                        price: 129.99,
                        category: 'Footwear',
                        image_url: '/images/runningshoes.jpg',
                        stock: 60
                    },
                    {
                        name: 'Desk Lamp',
                        slug: 'desk-lamp',
                        description: 'LED desk lamp with adjustable brightness and color temperature. Perfect for reading and working.',
                        price: 34.99,
                        category: 'Home & Kitchen',
                        image_url: '/images/desklamp.jpg',
                        stock: 45
                    },
                    {
                        name: 'Bluetooth Speaker',
                        slug: 'bluetooth-speaker',
                        description: 'Portable Bluetooth speaker with 360° sound and 12-hour battery life. Waterproof and durable.',
                        price: 59.99,
                        category: 'Electronics',
                        image_url: '/images/speaker.jpg',
                        stock: 35
                    },
                    {
                        name: 'Yoga Mat',
                        slug: 'yoga-mat',
                        description: 'Eco-friendly yoga mat with non-slip surface. Perfect for yoga, pilates, and meditation.',
                        price: 29.99,
                        category: 'Fitness',
                        image_url: '/images/yogamat.jpg',
                        stock: 80
                    }
                ];

                const insertStmt = db.prepare(
                    `INSERT INTO items (name, slug, description, price, category, image_url, stock) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                );

                sampleItems.forEach(item => {
                    insertStmt.run(
                        item.name,
                        item.slug,
                        item.description,
                        item.price,
                        item.category,
                        item.image_url,
                        item.stock
                    );
                });

                insertStmt.finalize((err) => {
                    if (err) {
                        console.error('Error inserting sample items:', err);
                        reject(err);
                        return;
                    }
                    console.log(`✅ ${sampleItems.length} sample items inserted`);

                    // Add sample comments for testing
                    const comments = [
                        { item_id: 1, username: 'JohnDoe', comment: 'Great headphones! Excellent sound quality and noise cancellation.', rating: 5 },
                        { item_id: 1, username: 'JaneSmith', comment: 'Comfortable to wear for hours. Battery life is amazing!', rating: 4 },
                        { item_id: 1, username: 'MikeJohnson', comment: 'Noise cancellation is a game-changer for flights. Highly recommend!', rating: 5 },
                        { item_id: 1, username: 'SarahWilson', comment: 'Good value for money. Sound is crisp and clear.', rating: 4 },
                        { item_id: 2, username: 'AlexChen', comment: 'Love this smart watch! Tracks everything accurately.', rating: 5 },
                        { item_id: 3, username: 'EmilyBrown', comment: 'Perfect backpack for traveling. Very durable.', rating: 5 }
                    ];

                    const commentStmt = db.prepare(
                        `INSERT INTO comments (item_id, username, comment, rating) VALUES (?, ?, ?, ?)`
                    );

                    comments.forEach(comment => {
                        commentStmt.run(
                            comment.item_id,
                            comment.username,
                            comment.comment,
                            comment.rating
                        );
                    });

                    commentStmt.finalize((err) => {
                        if (err) {
                            console.error('Error inserting sample comments:', err);
                            reject(err);
                            return;
                        }
                        console.log(`✅ ${comments.length} sample comments inserted`);
                        console.log('🔄 Database refresh complete!');
                        resolve(db);
                    });
                });
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            reject(error);
        }
    });
}

// Database query helper functions
function getAllItems(db) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM items ORDER BY created_at DESC', (err, rows) => {
            if (err) {
                console.error('Error in getAllItems:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getItemBySlug(db, slug) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM items WHERE slug = ?', [slug], (err, row) => {
            if (err) {
                console.error('Error in getItemBySlug:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getCommentsByItemId(db, itemId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM comments WHERE item_id = ? ORDER BY created_at DESC',
            [itemId],
            (err, rows) => {
                if (err) {
                    console.error('Error in getCommentsByItemId:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

function addComment(db, itemId, username, comment, rating) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO comments (item_id, username, comment, rating) VALUES (?, ?, ?, ?)',
            [itemId, username, comment, rating],
            function(err) {
                if (err) {
                    console.error('Error in addComment:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

function searchItems(db, query) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM items 
             WHERE name LIKE ? 
             OR description LIKE ? 
             OR category LIKE ?
             ORDER BY created_at DESC`,
            [`%${query}%`, `%${query}%`, `%${query}%`],
            (err, rows) => {
                if (err) {
                    console.error('Error in searchItems:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Get item by ID
function getItemById(db, id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error in getItemById:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Export functions that expect db instance
module.exports = {
    initializeDatabase,
    getAllItems,
    getItemBySlug,
    getItemById,
    getCommentsByItemId,
    addComment,
    searchItems
};