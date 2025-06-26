const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');

const secret = 'thisismysecret';

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/secrets');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ['password'],
});

const user = mongoose.model('second', userSchema);

app.post('/register', async (req, res) => {
  const newUser = new user({
    email: req.body.username,
    password: req.body.password,
  });

  try {
    await newUser.save();
    res.render('secrets');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const findUser = await user.findOne({ email: username });

    if (!findUser) {
      return res.status(401).send('User not found');
    }

    if (findUser.password === password) {
      return res.status(200).send('Login successful');
    } else {
      return res.status(401).send('Invalid password');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => res.render('home'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
