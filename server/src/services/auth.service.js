const crypto = require('crypto');
const AppConfigModel = require('../models/appConfig.model');
const logger = require('../utils/logger');

const ACCESS_CODE_KEY = 'access_code';

// Constant-time string comparison to prevent timing attacks on access-code and
// signature checks. crypto.timingSafeEqual requires equal-length buffers, so a
// length mismatch is rejected up front (this leaks length via timing, but not
// content — an acceptable tradeoff, same as most timingSafeEqual usages).
function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-memory cache so a normal login/verify doesn't hit the DB on every request —
// only the first read per process, and again right after a rotation. This is a
// single-process ops-desk tool (no horizontal scaling), so a per-process cache
// is safe; it would need a shared store (e.g. Redis) if ever run multi-instance.
let cachedCode = null;

const AuthService = {
  /**
   * Fetches the current shared access code (cached after first read).
   * @returns {Promise<string>}
   */
  async getCurrentCode() {
    if (cachedCode !== null) return cachedCode;

    const code = await AppConfigModel.get(ACCESS_CODE_KEY);
    if (!code) {
      throw new Error('Access code is not configured. Server was not migrated correctly.');
    }
    cachedCode = code;
    return cachedCode;
  },

  /**
   * Validates access code and returns signed token if valid
   * @param {string} code
   * @returns {Promise<string|null>} Signed token or null
   */
  async verifyCode(code) {
    const currentCode = await this.getCurrentCode();
    if (!timingSafeStringEqual(code, currentCode)) {
      return null;
    }

    // Generate payload with 2-hour expiration
    const payload = {
      role: 'ops_staff',
      exp: Date.now() + 1000 * 60 * 60 * 2
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', currentCode)
      .update(payloadStr)
      .digest('hex');

    const tokenData = {
      payload,
      signature
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  },

  /**
   * Verifies signed token against the CURRENT access code — rotating the code
   * automatically invalidates every token signed under the old one.
   * @param {string} token
   * @returns {Promise<boolean>} True if token is valid and not expired
   */
  async verifyToken(token) {
    if (!token) return false;

    try {
      const currentCode = await this.getCurrentCode();
      const raw = Buffer.from(token, 'base64').toString('utf8');
      const { payload, signature } = JSON.parse(raw);

      const payloadStr = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', currentCode)
        .update(payloadStr)
        .digest('hex');

      if (!timingSafeStringEqual(signature, expectedSignature)) {
        return false;
      }

      if (Date.now() > payload.exp) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Changes the shared access code. Requires knowledge of the current code.
   * The caller chooses the new code themselves, so distributing it to the rest
   * of the ops team is their responsibility (radio, shift briefing, etc.) —
   * the app never displays or transmits it anywhere.
   * @param {string} currentCodeAttempt
   * @param {string} newCode
   * @returns {Promise<boolean>} True if the change succeeded
   */
  async changeCode(currentCodeAttempt, newCode) {
    const currentCode = await this.getCurrentCode();
    if (!timingSafeStringEqual(currentCodeAttempt, currentCode)) {
      return false;
    }
    if (!newCode || newCode.length < 6) {
      const err = new Error('New access code must be at least 6 characters.');
      err.status = 400;
      throw err;
    }
    if (newCode === currentCode) {
      const err = new Error('New access code must be different from the current one.');
      err.status = 400;
      throw err;
    }

    await AppConfigModel.set(ACCESS_CODE_KEY, newCode);
    cachedCode = newCode;
    logger.info('Access code was rotated by an authenticated operator. All prior sessions are now invalid.');
    return true;
  }
};

module.exports = AuthService;

// Test-only hook to reset the in-memory cache between test cases. Not part of
// the service's real public API — do not call this from application code.
module.exports._resetCacheForTests = () => {
  cachedCode = null;
};
