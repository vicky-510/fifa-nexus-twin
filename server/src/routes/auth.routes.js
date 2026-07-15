const express = require('express');
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/verify', AuthController.verify);

// Requires a currently valid session AND the current code, since only
// someone already authenticated should be able to rotate the shared code.
router.post('/change-code', authMiddleware, AuthController.changeCode);

module.exports = router;
