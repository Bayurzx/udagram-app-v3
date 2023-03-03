// This is how you get your Bearer ey... value for your postman
const jwt = require('jsonwebtoken');

const payload = { username: 'bayurzx' };
const secret = '...'; // enter your secretKey

const token = jwt.sign(payload, secret);
