const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const windowMs = env.rateLimit.windowMinutes * 60 * 1000;

const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  });
};

const generalLimiter = rateLimit({
  windowMs,
  max: env.rateLimit.maxGeneral,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

const authLimiter = rateLimit({
  windowMs,
  max: env.rateLimit.maxAuth,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  skipSuccessfulRequests: true,
});

const adminLimiter = rateLimit({
  windowMs,
  max: env.rateLimit.maxAdmin,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

module.exports = { generalLimiter, authLimiter, adminLimiter };
