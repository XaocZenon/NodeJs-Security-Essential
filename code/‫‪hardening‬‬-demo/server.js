
const express = require('express');
const app = express();

app.disable('x-powered-by');

app.use((req, res, next) => {
    res.setHeader('X-powered-by', 'PHP/7.4');
    next();
});

app.get('/api/users', (req, res) => {
  res.json({ users: ['admin', 'user1'] });
});

app.listen(3000);