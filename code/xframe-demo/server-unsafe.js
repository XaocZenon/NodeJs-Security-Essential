// server-unsafe.js
const express = require('express');
const app = express();
const PORT = 3000;

// NO X-Frame-Options header - VULNERABLE
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

// Simulated session (insecure for demo)
let currentUser = null;

// Home page - VULNERABLE to iframe embedding
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
            <title>Bank App (Unsafe - No X-Frame)</title>
            <style>
                body { font-family: Arial; margin: 0; padding: 20px; background: #f0f0f0; }
                .bank-app { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .danger { background: #ffebee; color: #c62828; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #c62828; }
                .success { background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2e7d32; }
                button { background: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
                button:hover { background: #1976d2; }
                button.danger-btn { background: #f44336; }
                input { padding: 8px; margin: 5px; width: 200px; }
                .transfer-form { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                h1 { color: #d32f2f; }
            </style>
        </head>
        <body>
            <div class="bank-app">
                <h1>🏦 Bank Portal (UNSAFE)</h1>
                <div class="danger">
                    ⚠️ <strong>VULNERABLE:</strong> No X-Frame-Options header<br>
                    This page can be embedded in malicious iframes
                </div>
                
                ${userInfo}
                
                <div style="margin: 20px 0;">
                    <button onclick="login('alice')">Login as Alice</button>
                    <button onclick="login('bob')">Login as Bob</button>
                    <button onclick="logout()" class="danger-btn">Logout</button>
                </div>
                
                <div class="transfer-form">
                    <h3>💰 Transfer Money</h3>
                    <input type="text" id="toAccount" placeholder="Recipient Account" value="ATTACKER-ACC">
                    <input type="number" id="amount" placeholder="Amount" value="1000"><br>
                    <button onclick="transferMoney()">Transfer Now</button>
                    <p><small>Try: Open browser console and run attack payloads</small></p>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                    <h4>🔓 Security Status</h4>
                    <p><strong>X-Frame-Options:</strong> ❌ NOT SET</p>
                    <p><strong>Clickjacking Protection:</strong> ❌ VULNERABLE</p>
                    <p><strong>Test:</strong> Run attacker server on port 4000</p>
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
                
                // Check if we're in an iframe
                if (window !== window.top) {
                    document.querySelector('.danger').innerHTML += 
                        '<br>⚠️ <strong>DETECTED:</strong> This page is loaded inside an iframe!';
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

// Logout endpoint
app.post('/logout', (req, res) => {
    currentUser = null;
    res.json({ success: true, message: 'Logged out' });
});

// Transfer endpoint
app.post('/transfer', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    
    const { toAccount, amount } = req.body;
    
    if (amount > users[currentUser].balance) {
        return res.json({ success: false, message: 'Insufficient funds' });
    }
    
    // Simulate transfer
    users[currentUser].balance -= amount;
    
    res.json({ 
        success: true, 
        message: `Transferred $${amount} to ${toAccount}`,
        newBalance: users[currentUser].balance
    });
});

// API to check vulnerability
app.get('/check-headers', (req, res) => {
    res.json({
        server: 'Unsafe Bank Server',
        port: PORT,
        vulnerable: true,
        headers: {
            'X-Frame-Options': 'NOT SET - VULNERABLE',
            'Content-Security-Policy': 'NOT SET',
            'Clickjacking-Protection': 'NONE'
        },
        note: 'This server can be embedded in iframes'
    });
});

app.listen(PORT, () => {
    console.log(`🚨 UNSAFE Bank Server running on http://localhost:${PORT}`);
    console.log(`🔓 VULNERABLE to clickjacking - No X-Frame-Options`);
});