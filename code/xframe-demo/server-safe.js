// server-safe.js
const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 3001;

// Use Helmet for security headers including X-Frame-Options
app.use(helmet({
    hsts:{
        maxAge: 40000,
        includeSubDomain: true,
    },
    frameguard: {
        action: 'deny'  // DENY - prevents all framing
        // Other options: 'sameorigin', 'allow-from uri'
    },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulated bank account data
const users = {
    "alice": { 
        balance: 5000, 
        email: "alice@bank.com",
        accountNumber: "ACC123456"
    },
    "bob": { 
        balance: 7500, 
        email: "bob@bank.com",
        accountNumber: "ACC789012"
    }
};

let currentUser = null;

// Home page - PROTECTED from iframe embedding
app.get('/', (req, res) => {
    const userInfo = currentUser ? 
        `<h3>Logged in as: ${currentUser}</h3>
         <p>Balance: $${users[currentUser].balance}</p>
         <p>Account: ${users[currentUser].accountNumber}</p>` : 
        "<p>Not logged in</p>";

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bank App (Safe - With X-Frame)</title>
            <style>
                body { font-family: Arial; margin: 0; padding: 20px; background: #f0f0f0; }
                .bank-app { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .success { background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2e7d32; }
                button { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
                button:hover { background: #388e3c; }
                input { padding: 8px; margin: 5px; width: 200px; }
                .transfer-form { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                h1 { color: #2e7d32; }
            </style>
        </head>
        <body>
            <div class="bank-app">
                <h1>🏦 Bank Portal (SAFE)</h1>
                <div class="success">
                    ✅ <strong>PROTECTED:</strong> X-Frame-Options: DENY<br>
                    This page cannot be embedded in iframes
                </div>
                
                ${userInfo}
                
                <div style="margin: 20px 0;">
                    <button onclick="login('alice')">Login as Alice</button>
                    <button onclick="login('bob')">Login as Bob</button>
                    <button onclick="logout()" style="background: #f44336;">Logout</button>
                </div>
                
                <div class="transfer-form">
                    <h3>💰 Transfer Money</h3>
                    <input type="text" id="toAccount" placeholder="Recipient Account">
                    <input type="number" id="amount" placeholder="Amount"><br>
                    <button onclick="transferMoney()">Transfer Now</button>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background: #e8f5e9; border-radius: 5px;">
                    <h4>🔒 Security Status</h4>
                    <p><strong>X-Frame-Options:</strong> ✅ DENY</p>
                    <p><strong>Clickjacking Protection:</strong> ✅ ACTIVE</p>
                    <p><strong>Frame Embedding:</strong> ❌ BLOCKED</p>
                </div>
            </div>
            
            <script>
                function login(user) {
                    fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user })
                    }).then(() => location.reload());
                }
                
                function logout() {
                    fetch('/logout', { method: 'POST' }).then(() => location.reload());
                }
                
                function transferMoney() {
                    const toAccount = document.getElementById('toAccount').value;
                    const amount = document.getElementById('amount').value;
                    
                    fetch('/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toAccount, amount: parseInt(amount) })
                    }).then(res => res.json()).then(data => {
                        alert(data.message);
                        location.reload();
                    });
                }
                
                // Try to detect iframe (should not be possible)
                try {
                    if (window !== window.top) {
                        console.log("This shouldn't happen - page is framed!");
                    }
                } catch(e) {
                    console.log("Frame access blocked by X-Frame-Options");
                }
            </script>
        </body>
        </html>
    `);
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username } = req.body;
    if (users[username]) {
        currentUser = username;
        res.json({ success: true, message: `Logged in as ${username}` });
    } else {
        res.status(401).json({ success: false, message: 'User not found' });
    }
});

app.post('/logout', (req, res) => {
    currentUser = null;
    res.json({ success: true, message: 'Logged out' });
});

app.post('/transfer', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { toAccount, amount } = req.body;
    
    if (amount > users[currentUser].balance) {
        return res.json({ success: false, message: 'Insufficient funds' });
    }
    
    users[currentUser].balance -= amount;
    
    res.json({ 
        success: true, 
        message: `Transferred $${amount} to ${toAccount}`,
        newBalance: users[currentUser].balance
    });
});

// API to check security headers
app.get('/check-headers', (req, res) => {
    res.json({
        server: 'Safe Bank Server',
        port: PORT,
        protected: true,
        headers: {
            'X-Frame-Options': 'DENY',
            'Content-Security-Policy': 'frame-ancestors \'none\'',
            'Clickjacking-Protection': 'ACTIVE'
        },
        note: 'This server CANNOT be embedded in iframes'
    });
});

app.listen(PORT, () => {
    console.log(`✅ SAFE Bank Server running on http://localhost:${PORT}`);
    console.log(`🔒 PROTECTED with X-Frame-Options: DENY`);
});