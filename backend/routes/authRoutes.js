const express = require('express');
const { login, logout } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const loginRateLimiter = require('../middleware/loginRateLimiter');

const router = express.Router();
router.post('/login', loginRateLimiter, login);
router.post('/logout', requireAuth, logout);

module.exports = router;
