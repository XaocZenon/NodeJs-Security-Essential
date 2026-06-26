const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Global database instance
let dbInstance = null;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize database with fresh data on startup
async function initDatabase() {
    try {
        console.log('🔄 Refreshing database...');
        dbInstance = await db.initializeDatabase();
        console.log('✅ Database refreshed with fresh data');
        
        // Verify data was inserted
        const items = await db.getAllItems(dbInstance);
        console.log(`📦 ${items.length} products loaded`);
        
        if (items.length > 0) {
            console.log('📋 Sample products:');
            items.slice(0, 3).forEach(item => {
                console.log(`   - ${item.name} ($${item.price})`);
            });
        }
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Middleware to attach db instance to request
app.use((req, res, next) => {
    req.db = dbInstance;
    next();
});

// ============================================
// VULNERABLE ROUTES - Contains XSS Flaws
// ============================================

// 1. REFLECTED XSS - Search parameter
app.get('/', async (req, res) => {
    try {
        const items = await db.getAllItems(req.db);
        // VULNERABLE: Directly using query parameter without sanitization
        const searchQuery = req.query.q || '';
        
        res.render('landing', { 
            title: 'Shop - Home',
            items: items,
            query: searchQuery  // VULNERABLE: Reflected XSS
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading items');
    }
});

// 2. REFLECTED XSS - Search results page
app.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.render('search', {
                title: 'Search',
                items: [],
                query: q,  // VULNERABLE: Reflected XSS
                message: 'Please enter a search term'
            });
        }

        const items = await db.searchItems(req.db, q.trim());
        
        res.render('search', {
            title: `Search Results for "${q}"`,  // VULNERABLE: Reflected XSS
            items: items,
            query: q,  // VULNERABLE: Reflected XSS
            message: items.length === 0 ? 'No items found' : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error searching items');
    }
});

// 3. STORED XSS - Comments (Persistent XSS)
app.post('/item/:slug/comment', async (req, res) => {
    try {
        const { slug } = req.params;
        const { username, comment, rating } = req.body;

        if (!username || !comment || !rating) {
            return res.status(400).send('All fields are required');
        }

        const item = await db.getItemBySlug(req.db, slug);
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // VULNERABLE: Storing raw user input without sanitization
        await db.addComment(req.db, item.id, username, comment, parseInt(rating));
        res.redirect(`/item/${slug}#comments`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding comment');
    }
});

// 4. STORED XSS - Display comments
app.get('/item/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const item = await db.getItemBySlug(req.db, slug);
        
        if (!item) {
            return res.status(404).send('Item not found');
        }

        const comments = await db.getCommentsByItemId(req.db, item.id);
        
        // VULNERABLE: Rendering unescaped HTML
        res.render('item', {
            title: item.name,
            item: item,
            comments: comments,
            rating: calculateAverageRating(comments)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading item');
    }
});

// Helper function
function calculateAverageRating(comments) {
    if (!comments || comments.length === 0) return 0;
    const sum = comments.reduce((acc, comment) => acc + comment.rating, 0);
    return (sum / comments.length).toFixed(1);
}

// Start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log('\n⚠️  VULNERABLE SERVER RUNNING ON http://localhost:' + PORT);
        console.log('⚠️  This server contains XSS vulnerabilities!');
        console.log('⚠️  DO NOT use in production!');
        console.log('\n📌 XSS Test Payloads:');
        console.log('   Reflected XSS: http://localhost:3000/?q=<script>alert("XSS")</script>');
        console.log('   Stored XSS: Submit comment with <script>alert("XSS")</script>');
        console.log('   DOM XSS: Try document.write(\'... <script>alert(document.domain)</script> ...\'); ');
        console.log('\n🔄 Database is refreshed on every restart');
        console.log('💡 All changes are reset when server restarts\n');
    });
}

startServer();