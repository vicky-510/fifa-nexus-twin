const rateLimit = require('express-rate-limit');

const triggerRateLimiter = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // Limit each IP to 1 request per 5 seconds
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
  message: {
    error: 'Too many requests. Please wait 5 seconds before triggering another simulation.'
  }
});

module.exports = triggerRateLimiter;
