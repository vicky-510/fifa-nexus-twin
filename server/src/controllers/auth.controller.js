const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

const AuthController = {
  /**
   * Verifies shared access code and returns signed token
   */
  async verify(req, res, next) {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Access code is required.' });
      }
      
      const token = AuthService.verifyCode(code);
      if (!token) {
        logger.warn(`Failed verification attempt. IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid access code. Access denied.' });
      }
      
      logger.info(`Access code successfully verified. IP: ${req.ip}`);
      return res.json({ token });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
