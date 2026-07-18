const express = require('express');
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireFullAccess = require('../middleware/requireFullAccess.middleware');

const router = express.Router();

router.post('/verify', AuthController.verify);

// No access code required — issues a read-only guest session.
router.post('/guest', AuthController.guestLogin);

// Requires a currently valid full-access session AND the current code, since
// only an authenticated ops staffer (not a guest) should be able to rotate
// the shared code.
router.post('/change-code', authMiddleware, requireFullAccess, AuthController.changeCode);

module.exports = router;
