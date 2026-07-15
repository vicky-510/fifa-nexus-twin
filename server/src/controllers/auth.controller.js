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

      const token = await AuthService.verifyCode(code);
      if (!token) {
        logger.warn(`Failed verification attempt. IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid access code. Access denied.' });
      }

      logger.info(`Access code successfully verified. IP: ${req.ip}`);
      return res.json({ token });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Changes the shared access code. Requires an authenticated session (already
   * enforced by authMiddleware on this route) AND knowledge of the current code.
   * The new code is never echoed back or logged — the operator who set it already
   * knows it and is responsible for relaying it to the rest of the ops team.
   */
  async changeCode(req, res, next) {
    try {
      const { currentCode, newCode } = req.body;

      if (!currentCode || !newCode) {
        return res.status(400).json({ error: 'Both currentCode and newCode are required.' });
      }

      const success = await AuthService.changeCode(currentCode, newCode);
      if (!success) {
        logger.warn(`Failed access-code change attempt (wrong current code). IP: ${req.ip}`);
        return res.status(401).json({ error: 'Current access code is incorrect.' });
      }

      return res.json({ message: 'Access code changed successfully. All previous sessions have been invalidated — log in again with the new code.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
