const express = require('express');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/verify', AuthController.verify);

module.exports = router;
