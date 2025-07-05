require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.set('view engine', 'ejs');

mongoose.connect('mongodb+srv://upendratripathy9:hDDSVGE6FJaig330@secrets.144ueef.mongodb.net/?retryWrites=true&w=majority&appName=secrets');

// Model
const User = require('./model/user');

// Middleware to check auth
function isAuthenticated(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

// Routes
app.get('/', (req, res) => res.redirect('/register'));

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const emailRegex = /^\S+@\S+\.\S+$/;
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!emailRegex.test(email) || !passRegex.test(password)) {
    return res.send('Invalid email or password format.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashedPassword });
  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.send('User not found.');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.send('Invalid credentials.');

  const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  res.redirect('/secret');
});

app.get('/secret', isAuthenticated, (req, res) => {
  res.render('secret', { name: req.user.name });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
