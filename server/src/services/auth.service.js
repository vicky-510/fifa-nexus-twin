const crypto = require('crypto');
const env = require('../config/env');

const AuthService = {
  /**
   * Validates access code and returns signed token if valid
   * @param {string} code 
   * @returns {string|null} Signed token or null
   */
  verifyCode(code) {
    if (code !== env.ACCESS_CODE) {
      return null;
    }
    
    // Generate payload with 2-hour expiration
    const payload = {
      role: 'ops_staff',
      exp: Date.now() + 1000 * 60 * 60 * 2
    };
    
    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', env.ACCESS_CODE)
      .update(payloadStr)
      .digest('hex');
      
    const tokenData = {
      payload,
      signature
    };
    
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  },

  /**
   * Verifies signed token
   * @param {string} token 
   * @returns {boolean} True if token is valid and not expired
   */
  verifyToken(token) {
    if (!token) return false;
    
    try {
      const raw = Buffer.from(token, 'base64').toString('utf8');
      const { payload, signature } = JSON.parse(raw);
      
      const payloadStr = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', env.ACCESS_CODE)
        .update(payloadStr)
        .digest('hex');
        
      if (signature !== expectedSignature) {
        return false;
      }
      
      if (Date.now() > payload.exp) {
        return false;
      }
      
      return true;
    } catch (err) {
      return false;
    }
  }
};

module.exports = AuthService;
