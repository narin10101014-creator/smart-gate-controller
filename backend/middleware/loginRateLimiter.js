const rateLimit = require('express-rate-limit');
const { parseDurationMs } = require('../utils/duration');

const windowMs = parseDurationMs(process.env.LOGIN_RATE_LIMIT_WINDOW || '15m', 'LOGIN_RATE_LIMIT_WINDOW');
const max = Number(process.env.LOGIN_RATE_LIMIT_MAX || 5);

const loginRateLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true, // sends RateLimit-* headers, and Retry-After when blocked
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again later.' },
});

module.exports = loginRateLimiter;
