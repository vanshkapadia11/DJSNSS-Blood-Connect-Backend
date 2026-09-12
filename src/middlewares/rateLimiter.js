const rateLimit = require('express-rate-limit');

/**
 * Global limiter - applied to every request in app.js.
 * Generous enough for normal browsing, protects against basic abuse/DoS.
 */
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Stricter limiter for auth endpoints (login/register) to slow down
 * brute-force / credential-stuffing attempts.
 */
const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts from this IP, please try again later.',
  },
});

/**
 * Even stricter limiter for the volunteer "enroll" endpoint, to prevent
 * a single volunteer/script from spamming registrations across events.
 */
const enrollLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many enrollment attempts, please slow down.',
  },
});

module.exports = { globalLimiter, authLimiter, enrollLimiter };
