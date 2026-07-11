const express = require('express');
const SimulationController = require('../controllers/simulation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateScenario = require('../middleware/validateScenario.middleware');
const triggerRateLimiter = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Apply auth protection to all simulation routes
router.use(authMiddleware);

// Synchronous triggering route
router.post(
  '/simulation-trigger',
  triggerRateLimiter,
  validateScenario,
  SimulationController.trigger
);

// SSE Streaming triggering route
router.post(
  '/simulation-trigger/stream',
  triggerRateLimiter,
  validateScenario,
  SimulationController.triggerStream
);

// History retrieval route
router.get(
  '/simulation-history',
  validateScenario,
  SimulationController.getHistory
);

module.exports = router;
