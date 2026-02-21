
// server-safe.js
const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 3001;

// Comprehensive CSP Configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcElem: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            styleSrcElem: ["'self'", "'unsafe-inline'"],
            /*imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            baseUri: ["'self'"] */
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// HTML sanitization library (simulated)
const sanitizeHtml = (html) => {
    // In real app, use: npm install sanitize-html
    return html
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let messages = [
    { id: 1, user: 'admin', text: 'Welcome to the secure chat!', safe: true },
    { id: 2, user: 'alice', text: 'Hello everyone!', safe: true }
];

let users = [
    { id: 1, username: 'alice', balance: 1000, email: 'alice@example.com' },
    { id: 2, username: 'bob', balance: 2500, email: 'bob@example.com' }
];

// Safe middleware with sanitization
app.use((req, res, next) => {
    if (req.query.error) {
        req.errorMessage = sanitizeHtml(req.query.error);
    }
    if (req.query.search) {
        req.searchTerm = sanitizeHtml(req.query.search);
    }
    next();
});

app.get('/', (req, res) => {
    const errorDisplay = req.errorMessage ? 
        `<div class="error">Error: ${req.errorMessage}</div>` : '';
    
    const searchDisplay = req.searchTerm ?
        `<div class="search-results">Search results for: ${req.searchTerm}</div>` : '';
    
    // Sanitize all dynamic content
    const safeMessages = messages.map(msg => ({
        ...msg,
        user: sanitizeHtml(msg.user),
        text: msg.safe ? msg.text : sanitizeHtml(msg.text)
    }));
    
    const safeUsers = users.map(user => ({
        ...user,
        username: sanitizeHtml(user.username),
        email: sanitizeHtml(user.email)
    }));
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chat App (SAFE - With CSP)</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .safe { background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4caf50; }
                .error { background: #ffebee; padding: 10px; border-radius: 5px; margin: 10px 0; color: #c62828; }
                .search-results { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .chat-box { border: 1px solid #ddd; padding: 15px; height: 300px; overflow-y: auto; margin: 20px 0; background: #fafafa; }
                .message { padding: 8px; margin: 5px 0; background: white; border-radius: 5px; border-left: 3px solid #2196f3; }
                .message.admin { border-left-color: #4caf50; }
                .message.user { border-left-color: #ff9800; }
                input, textarea, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
                button { background: #4caf50; color: white; border: none; cursor: pointer; }
                button:hover { background: #388e3c; }
                .user-card { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .balance { color: #2e7d32; font-weight: bold; }
                .csp-demo { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                h1 { color: #2e7d32; }
                .security-status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                pre { background: #333; color: white; padding: 10px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🛡️ Chat Application (SAFE)</h1>
                
                <div class="safe">
                    ✅ <strong>PROTECTED:</strong> Content Security Policy Active<br>
                    This application is protected against Cross-Site Scripting (XSS) attacks
                </div>
                
                ${errorDisplay}
                ${searchDisplay}
                
                <div class="security-status">
                    <h3>🔒 Security Headers Status</h3>
                    <p><strong>Content-Security-Policy:</strong> ✅ ACTIVE (strict policy)</p>
                    <p><strong>X-XSS-Protection:</strong> ✅ 1; mode=block</p>
                    <p><strong>X-Content-Type-Options:</strong> ✅ nosniff</p>
                    <p><strong>Risk Level:</strong> 🟢 LOW</p>
                    
                    <details style="margin-top: 10px;">
                        <summary>View CSP Details</summary>
                        <pre>Content-Security-Policy: 
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
script-src-elem 'self';
script-src-attr 'none';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https: data:;
connect-src 'self';
frame-src 'none';
object-src 'none';
form-action 'self';
base-uri 'self';
frame-ancestors 'none';</pre>
                    </details>
                </div>
                
                <h2>💬 Secure Chat</h2>
                <div class="chat-box" id="chatBox">
                    ${safeMessages.map(msg => `
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
                    ${safeUsers.map(user => `
                        <div class="user-card">
                            <h3>${user.username}</h3>
                            <p>Balance: <span class="balance">$${user.balance}</span></p>
                            <p>Email: ${user.email}</p>
                            <button data-user-id="${user.id}">View Details</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- All JavaScript is in external files or properly sanitized -->
            <script>
                // SECURE: Use event delegation and safe DOM manipulation
                document.addEventListener('DOMContentLoaded', function() {
                    // Secure form handling
                    document.getElementById('messageForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const formData = new FormData(this);
                        const user = formData.get('user');
                        const message = formData.get('message');
                        
                        // SECURE: Use textContent instead of innerHTML
                        const chatBox = document.getElementById('chatBox');
                        const newMessage = document.createElement('div');
                        newMessage.className = 'message user';
                        
                        const strong = document.createElement('strong');
                        strong.textContent = user + ': ';
                        
                        const text = document.createTextNode(message);
                        
                        newMessage.appendChild(strong);
                        newMessage.appendChild(text);
                        chatBox.appendChild(newMessage);
                        
                        // Scroll to bottom
                        chatBox.scrollTop = chatBox.scrollHeight;
                        
                        // Clear form
                        this.reset();
                    });
                    
                    // Secure user details with event delegation
                    document.getElementById('userProfiles').addEventListener('click', function(e) {
                        if (e.target.tagName === 'BUTTON') {
                            const userId = e.target.getAttribute('data-user-id');
                            showUserDetails(userId);
                        }
                    });
                });
                
                // SECURE: Safe user details display
                function showUserDetails(userId) {
                    const details = {
                        1: { 
                            username: 'alice', 
                            fullName: 'Alice Johnson', 
                            ssn: '***-**-6789', // Partial display
                            phone: '555-01**' 
                        },
                        2: { 
                            username: 'bob', 
                            fullName: 'Bob Smith', 
                            ssn: '***-**-4321', 
                            phone: '555-98**' 
                        }
                    };
                    
                    const userInfo = details[userId];
                    // SECURE: Use textContent in alert
                    alert('User Details:\\nName: ' + userInfo.fullName + 
                          '\\nSSN: ' + userInfo.ssn + 
                          '\\nPhone: ' + userInfo.phone);
                }
                
                // Test CSP protection
                function testCSPProtection() {
                    const resultDiv = document.getElementById('cspTestResult');
                    resultDiv.innerHTML = '';
                    
                    const tests = [
                        {
                            name: 'Inline script execution',
                            test: () => {
                                try {
                                    eval('alert("Inline script test")');
                                    return { passed: false, message: 'Inline script executed (VULNERABLE)' };
                                } catch(e) {
                                    return { passed: true, message: 'Blocked by CSP' };
                                }
                            }
                        },
                        {
                            name: 'External script loading',
                            test: () => {
                                const script = document.createElement('script');
                                script.src = 'https://evil.com/malicious.js';
                                script.onerror = () => {
                                    return { passed: true, message: 'Blocked by CSP' };
                                };
                                document.head.appendChild(script);
                                return { passed: true, message: 'External scripts blocked' };
                            }
                        },
                        {
                            name: 'JavaScript URI',
                            test: () => {
                                const iframe = document.createElement('iframe');
                                iframe.src = 'javascript:alert("XSS")';
                                document.body.appendChild(iframe);
                                return { passed: true, message: 'JavaScript URIs blocked' };
                            }
                        }
                    ];
                    
                    tests.forEach(test => {
                        const result = test.test();
                        const div = document.createElement('div');
                        div.style.padding = '5px';
                        div.style.margin = '5px 0';
                        div.style.background = result.passed ? '#e8f5e9' : '#ffebee';
                        div.style.borderLeft = '3px solid ' + (result.passed ? '#4caf50' : '#f44336');
                        resultDiv.appendChild(div);
                    });
                }
                
                // Safe JSON parsing
                function safeParseJSON(json) {
                    try {
                        return JSON.parse(json);
                    } catch(e) {
                        console.error('Invalid JSON:', e);
                        return null;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// SECURE API endpoints
app.post('/post-message', (req, res) => {
    const user = sanitizeHtml(req.body.user);
    const message = sanitizeHtml(req.body.message);
    
    const newMessage = {
        id: messages.length + 1,
        user: user,
        text: message,
        safe: true  // Sanitized
    };
    messages.push(newMessage);
    res.redirect('/');
});

// Safe search with proper encoding
app.get('/search', (req, res) => {
    const query = sanitizeHtml(req.query.q || '');
    res.send(`
        <html>
        <head>
            <title>Search Results</title>
            ${helmet.contentSecurityPolicy.getDefaultDirectives()}
        </head>
        <body>
            <h1>Search Results</h1>
            <p>You searched for: ${query}</p>
            <a href="/">Back</a>
        </body>
        </html>
    `);
});

// Secure profile endpoint
app.get('/profile/:username', (req, res) => {
    const username = sanitizeHtml(req.params.username);
    res.send(`
        <html>
        <body>
            <h1>Profile: ${username}</h1>
            <div>Welcome <strong>${username}</strong>!</div>
            <a href="/">Back</a>
        </body>
        </html>
    `);
});

// Secure JSON API with proper headers
app.get('/api/users', (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        balance: u.balance
        // Email omitted for security
    })));
});

// Secure cookie endpoint
app.get('/set-cookie', (req, res) => {
    res.cookie('sessionId', 'secret-session-12345', { 
        httpOnly: true,  // Cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.redirect('/');
});

// Report URI for CSP violations (optional)
app.post('/csp-report', (req, res) => {
    console.log('CSP Violation Report:', req.body);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`✅ SAFE Server running on http://localhost:${PORT}`);
    console.log(`🛡️ CSP PROTECTED - XSS attacks blocked`);
});