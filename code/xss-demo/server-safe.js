const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

// Import xss-filters only
const xssFilters = require('xss-filters');

const app = express();
const PORT = 3001;

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
// SECURE ROUTES - XSS Protection with xss-filters
// ============================================

// Helper function to sanitize output using xss-filters
function sanitizeOutput(data) {
    if (typeof data === 'string') {
        return xssFilters.inHTMLData(data);
    }
    return data;
}

// Helper function to sanitize HTML content
function sanitizeHTML(content) {
    if (typeof content === 'string') {
        return xssFilters.inHTMLData(content);
    }
    return content;
}

// 1. REFLECTED XSS Protection - Search parameter
app.get('/', async (req, res) => {
    try {
        const items = await db.getAllItems(req.db);
        const searchQuery = req.query.q ? sanitizeOutput(req.query.q) : '';
        
        res.render('landing', { 
            title: 'Shop - Home',
            items: items,
            query: searchQuery  // SECURE: Sanitized with xss-filters
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Unable to load products. Please try again later.'
        });
    }
});

// 2. REFLECTED XSS Protection - Search results
app.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const sanitizedQuery = q ? sanitizeOutput(q) : '';
        
        if (!q || q.trim().length === 0) {
            return res.render('search', {
                title: 'Search',
                items: [],
                query: sanitizedQuery,
                message: 'Please enter a search term'
            });
        }

        const items = await db.searchItems(req.db, q.trim());
        
        res.render('search', {
            title: `Search Results for "${sanitizedQuery}"`,
            items: items,
            query: sanitizedQuery,
            message: items.length === 0 ? 'No items found matching your search' : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Unable to perform search'
        });
    }
});

// 3. STORED XSS Protection - Comments
app.post('/item/:slug/comment', async (req, res) => {
    try {
        const { slug } = req.params;
        let { username, comment, rating } = req.body;

        if (!username || !comment || !rating) {
            return res.status(400).send('All fields are required');
        }

        const item = await db.getItemBySlug(req.db, slug);
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // SECURE: Sanitize input using xss-filters before storing
        username = xssFilters.inHTMLData(username.trim());
        comment = xssFilters.inHTMLData(comment.trim());
        
        // Additional character escaping
        username = username.replace(/[<>]/g, function(match) {
            return match === '<' ? '&lt;' : '&gt;';
        });
        comment = comment.replace(/[<>]/g, function(match) {
            return match === '<' ? '&lt;' : '&gt;';
        });

        await db.addComment(req.db, item.id, username, comment, parseInt(rating));
        res.redirect(`/item/${slug}#comments`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding comment');
    }
});

// 4. STORED XSS Protection - Display comments
app.get('/item/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const item = await db.getItemBySlug(req.db, slug);
        
        if (!item) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                message: 'Product not found'
            });
        }

        const comments = await db.getCommentsByItemId(req.db, item.id);
        
        // SECURE: Sanitize all comment data using xss-filters
        const sanitizedComments = comments.map(comment => ({
            ...comment,
            username: xssFilters.inHTMLData(comment.username),
            comment: xssFilters.inHTMLData(comment.comment)
        }));
        
        res.render('item', {
            title: item.name,
            item: item,
            comments: sanitizedComments,
            rating: calculateAverageRating(comments)
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Unable to load product details'
        });
    }
});

// Helper function
function calculateAverageRating(comments) {
    if (!comments || comments.length === 0) return 0;
    const sum = comments.reduce((acc, comment) => acc + comment.rating, 0);
    return (sum / comments.length).toFixed(1);
}

// Error handlers
app.get('/error', (req, res) => {
    res.render('error', {
        title: 'Error',
        message: 'An error occurred'
    });
});

app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('error', {
        title: '500 - Server Error',
        message: 'Something went wrong on our end'
    });
});

// Start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log('\n🔒 SECURE SERVER RUNNING ON http://localhost:' + PORT);
        console.log('🔒 XSS protection enabled using xss-filters');
        console.log('🔒 All user input is sanitized');
        console.log('\n✅ XSS attacks will be neutralized!');
        console.log('🔄 Database is refreshed on every restart');
        console.log('💡 All changes are reset when server restarts\n');
    });
}

startServer();