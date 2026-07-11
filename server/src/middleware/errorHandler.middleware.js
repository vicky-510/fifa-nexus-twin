const logger = require('../utils/logger');

function errorHandlerMiddleware(err, req, res, next) {
  // Log full error details server-side
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}`, err);

  // Send a sanitized generic error message to client
  res.status(err.status || 500).json({
    error: 'An internal server error occurred. Please contact stadium operations system administrators.'
  });
}

module.exports = errorHandlerMiddleware;
