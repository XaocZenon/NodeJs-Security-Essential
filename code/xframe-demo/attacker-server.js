// attacker-server.js
const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.static('public'));

// Malicious page that attempts to frame the bank app
app.get('/', (req, res) => {
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
                
                <p>Not logged in</p>
                
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
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🎭 ATTACKER Server running on http://localhost:${PORT}`);
});