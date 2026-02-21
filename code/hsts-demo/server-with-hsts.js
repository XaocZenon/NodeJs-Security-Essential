// server-with-hsts.js
const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 3001;

// Use Helmet with HSTS configuration
app.use(helmet({
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
    }
}));

// Additional security headers
app.use(helmet.contentSecurityPolicy());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample users database
const users = [
    { id: 1, username: 'alice', password: 'password123' },
    { id: 2, username: 'bob', password: 'securepass' }
];

// Home route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login With HSTS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
                form { display: flex; flex-direction: column; }
                input, button { margin: 10px 0; padding: 10px; }
                .info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>Login (With HSTS)</h1>
            <div class="info">
                <strong>Server Info:</strong> This server uses HSTS headers.<br>
                <strong>Port:</strong> ${PORT}<br>
                <strong>HSTS Max-Age:</strong> 1 year<br>
            </div>
            <form action="/login" method="POST">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <p><a href="http://localhost:${PORT}/api/users">View users API</a></p>
        </body>
        </html>
    `);
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            message: 'Login successful!',
            user: { id: user.id, username: user.username },
            note: 'Server uses HSTS - Strict-Transport-Security header is set',
            security: 'All future requests should use HTTPS (enforced by browser)'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// API endpoint to view users (with HSTS protection)
app.get('/api/users', (req, res) => {
    res.json({
        server: 'With HSTS',
        port: PORT,
        headers: req.headers,
        security: 'HSTS enforced',
        users: users.map(u => ({ id: u.id, username: u.username }))
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server WITH HSTS running on http://localhost:${PORT}`);
});