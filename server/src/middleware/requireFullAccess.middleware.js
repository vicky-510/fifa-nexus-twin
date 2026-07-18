const logger = require('../utils/logger');

/**
 * Blocks the read-only 'guest' role from write-gated routes (triggering or
 * escalating a simulation, changing the access code, etc.). Must run after
 * authMiddleware, which sets req.authRole.
 */
function requireFullAccess(req, res, next) {
  if (req.authRole !== 'ops_staff') {
    logger.warn(`Guest role blocked from a write-gated route: ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Forbidden: Guests have read-only access.' });
  }
  next();
}

module.exports = requireFullAccess;
