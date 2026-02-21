// server-without-hsts.js
const express = require('express');
const app = express();
const PORT = 3000;

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
            <title>Login Without HSTS</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
                form { display: flex; flex-direction: column; }
                input, button { margin: 10px 0; padding: 10px; }
                .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>Login (Without HSTS)</h1>
            <div class="info">
                <strong>Server Info:</strong> This server does NOT use HSTS headers.<br>
                <strong>Port:</strong> ${PORT}<br>
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
            note: 'Server does NOT use HSTS - headers are insecure'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// API endpoint to view users (no HSTS protection)
app.get('/api/users', (req, res) => {
    res.json({
        server: 'Without HSTS',
        port: PORT,
        headers: req.headers,
        users: users.map(u => ({ id: u.id, username: u.username }))
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server WITHOUT HSTS running on http://localhost:${PORT}`);
});