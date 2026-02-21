const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const app = express();

// تولید secret قوی
const generateSecureSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const SECURE_SECRET = generateSecureSecret();
console.log('🔐 Secret امن:', SECURE_SECRET);

// ========== تنظیمات امن ==========
app.use(session({
  name: 'appSession_' + crypto.randomBytes(8).toString('hex'),
  secret: SECURE_SECRET,
  rolling: true,  
  cookie: {
    maxAge: 30 * 60 * 1000, 
    httpOnly: true,     
    secure: true,
  }
}));

// middleware امنیتی
app.use((req, res, next) => {
  // اضافه کردن هدرهای امنیتی
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // بازسازی نشست در صورت نیاز
  if (req.session && req.session.user && req.path === '/profile') {
    // بازسازی نشست برای صفحات حساس
    req.session.regenerate((err) => {
      if (err) {
        console.error('خطا در بازسازی نشست:', err);
      }
      console.log('🔄 نشست بازسازی شد');
      next();
    });
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>اپلیکیشن امن - آموزش</title>
        <style>
            body { font-family: 'Vazir', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; text-align: center; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #27ae60; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
            .secure-info { background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #27ae60; }
            input { padding: 10px; margin: 5px; width: 200px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .info { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✅ اپلیکیشن امن ✅</h1>
            <h2>فرم ورود امن</h2>
            <form action="/secure-login" method="POST">
                <input type="text" name="username" placeholder="نام کاربری" value="test"><br>
                <input type="password" name="password" placeholder="رمز عبور" value="test"><br>
                <button type="submit">ورود امن</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

app.get('/secure-profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>پروفایل امن</title>
        <style>
            body { font-family: 'Vazir', sans-serif; background: #f5f5f5; padding: 20px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>👤 پروفایل کاربر (امن)</h2>
            <p>خوش آمدید ${req.session.user.username}!</p>
            <p>شناسه نشست شما: <code>${req.sessionID}</code></p>
            <a href="/secure-logout">خروج</a>
        </div>
        
        <script>
            // تلاش برای دسترسی به کوکی (ناموفق)
            console.log('🍪 تلاش برای دیدن کوکی:', document.cookie);
        </script>
    </body>
    </html>
  `);
});

app.post('/secure-login', express.urlencoded({ extended: true }), (req, res) => {
  // بازسازی نشست قبل از ورود (مهم!)
  req.session.regenerate((err) => {
    if (err) {
      console.error('خطا:', err);
      return res.redirect('/');
    }
    
    // ذخیره اطلاعات کاربر
    req.session.user = {
      id: 1,
      username: req.body.username,
      role: 'user',
      loginTime: new Date().toISOString()
    };
    
    console.log('✅ ورود امن:', req.body.username);
    console.log('🆔 Session ID جدید:', req.sessionID);
    
    res.redirect('/secure-profile');
  });
});

app.get('/secure-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('خطا:', err);
    }
    res.redirect('/');
  });
});

// ========== راه‌اندازی سرور امن ==========
const SECURE_PORT = 3001;
app.listen(SECURE_PORT, '0.0.0.0', () => {
  console.log('🟢 secure is running', SECURE_PORT);
});