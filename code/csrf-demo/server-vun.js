const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const db = require('./database');

const app = express();

// مرور درس های قبلی
// CSP - Hardening - HSTS - X-Frame-Options
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcElem: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            styleSrcElem: ["'self'", "'unsafe-inline'"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    }
}));

// تنظیمات
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// initialize SQLite schema and sample data
db.initDb();

function requireAuth(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('landing(V)');
});

app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('register(V)', {
        errorMessage: null,
        successMessage: null,
        formData: {}
    });
});

app.post('/register', async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.render('register(V)', {
            errorMessage: 'All fields are required.',
            successMessage: null,
            formData: { fullName, email, username }
        });
    }

    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
        return res.render('register(V)', {
            errorMessage: 'That username is already taken.',
            successMessage: null,
            formData: { fullName, email, username }
        });
    }

    await db.createUser({ fullName, email, username, password });
    res.render('register(V)', {
        errorMessage: null,
        successMessage: 'Your account has been created. You can log in now.',
        formData: {}
    });
});

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('login(V)', {
        errorMessage: null,
        formData: {}
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login(V)', {
            errorMessage: 'Username and password are required.',
            formData: { username }
        });
    }

    const user = await db.getUserByUsername(username);
    if (!user || user.password !== password) {
        return res.render('login(V)', {
            errorMessage: 'Invalid username or password.',
            formData: { username }
        });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, async (req, res) => {
    const user = await db.getUserById(req.session.userId);
    if (!user) return res.redirect('/login');
    const message = req.session.message || null;
    delete req.session.message;
    res.render('dashboard(V)', { user, message });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// transfer funds
app.post('/transfer', requireAuth, async (req, res) => {
    const { to, amount } = req.body;
    const fromId = req.session.userId;

    if (!to || !amount) {
        req.session.message = { type: 'error', text: 'Recipient and amount are required.' };
        return res.redirect('/dashboard');
    }

    try {
        const result = await db.transferFunds(fromId, to, amount);
        if (!result.success) {
            req.session.message = { type: 'error', text: result.error };
            return res.redirect('/dashboard');
        }
        req.session.message = { type: 'success', text: `Transferred ${amount} to ${to}.` };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.session.message = { type: 'error', text: 'Transfer failed.' };
        res.redirect('/dashboard');
    }
});

// change email
app.post('/change-email', requireAuth, async (req, res) => {
    const { email } = req.body;
    const userId = req.session.userId;

    if (!email) {
        req.session.message = { type: 'error', text: 'Email is required.' };
        return res.redirect('/dashboard');
    }

    try {
        await db.updateEmail(userId, email);
        req.session.message = { type: 'success', text: 'Email updated.' };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.session.message = { type: 'error', text: 'Failed to update email.' };
        res.redirect('/dashboard');
    }
});

// اجرا
app.listen(3000, () => {
    console.log('app is on : http://localhost:3000');
});