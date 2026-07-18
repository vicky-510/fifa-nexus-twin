const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`Unauthorized request blocked. Remote IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await AuthService.getTokenPayload(token);

    if (!payload) {
      logger.warn(`Unauthorized request blocked (Invalid or expired token). Remote IP: ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token.' });
    }

    req.authRole = payload.role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
