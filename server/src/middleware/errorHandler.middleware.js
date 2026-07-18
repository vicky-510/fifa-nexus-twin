const logger = require('../utils/logger');

// Express identifies an error handler by its 4-argument arity, so the unused
// `next` parameter must stay in the signature (underscored to satisfy lint).
function errorHandlerMiddleware(err, req, res, _next) {
  // Log full error details server-side
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}`, err);

  // Send a sanitized generic error message to client
  res.status(err.status || 500).json({
    error: 'An internal server error occurred. Please contact stadium operations system administrators.'
  });
}

module.exports = errorHandlerMiddleware;
