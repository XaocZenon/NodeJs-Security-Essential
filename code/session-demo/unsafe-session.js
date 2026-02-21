const express = require('express');
const session = require('express-session');
const app = express();

// ========== تنظیمات ناامن ==========
app.use(session({
  name: 'sid',
  secret: '123',
  cookie:{
    maxAge: 7*24*60*60*1000,
    httpOnly: false,
    secure: false,
  }
}));


// middleware برای لاگ کردن کوکی‌ها
app.use((req, res, next) => {
  console.log('📨 درخواست جدید:', req.method, req.url);
  console.log('🍪 کوکی دریافتی:', req.headers.cookie);
  console.log('🆔 Session ID:', req.sessionID);
  console.log('---');
  next();
});

// صفحات HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>اپلیکیشن ناامن - آموزش</title>
        <style>
            body { font-family: 'Vazir', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; text-align: center; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #c0392b; border-bottom: 3px solid #c0392b; padding-bottom: 10px; }
            .warning { background: #ffebee; color: #c62828; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #c0392b; }
            input { padding: 10px; margin: 5px; width: 200px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; background: #c0392b; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .info { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚠️ اپلیکیشن ناامن ⚠️</h1>
            <div class="warning">
                <strong>خطر!</strong> این سایت برای نمایش آسیب‌پذیری‌های امنیتی ساخته شده است.
            </div>

            <h2>فرم ورود</h2>
            <form action="/login" method="POST">
                <input type="text" name="username" placeholder="نام کاربری" value="test"><br>
                <input type="password" name="password" placeholder="رمز عبور" value="test"><br>
                <button type="submit">ورود</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

// صفحه پروفایل
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>پروفایل - اپلیکیشن ناامن</title>
        <style>
            body { font-family: 'Vazir', sans-serif; background: #f5f5f5; padding: 20px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>👤 پروفایل کاربر</h2>
            <p>خوش آمدید ${req.session.user.username}!</p>
            <p>شناسه نشست شما: <code>${req.sessionID}</code></p>
            <p>این شناسه در کوکی ذخیره شده است</p>
            <a href="/logout">خروج</a>
        </div>
        
        <script>
            // نمایش کوکی در console (به دلیل httpOnly: false)
            console.log('🍪 کوکی شما:', document.cookie);
            console.log('🆔 Session ID:', document.cookie.split('sid=')[1]);
        </script>
    </body>
    </html>
  `);
});

// پردازش ورود
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  // توجه: در برنامه واقعی، رمز عبور را چک می‌کنیم
  req.session.user = {
    id: 1,
    username: req.body.username,
    role: 'user'
  };
  
  console.log('✅ کاربر وارد شد:', req.body.username);
  console.log('🆔 Session ID جدید:', req.sessionID);
  
  res.redirect('/profile');
});

// خروج
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// برای دیباگ
app.get('/debug-cookie', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
    user: req.session.user
  });
});

// ========== راه‌اندازی سرور ناامن ==========
const INSECURE_PORT = 3000;
app.listen(INSECURE_PORT, '0.0.0.0', () => {
  console.log('🔴 unsafe is running', INSECURE_PORT);
});