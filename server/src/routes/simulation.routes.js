const express = require('express');
const SimulationController = require('../controllers/simulation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireFullAccess = require('../middleware/requireFullAccess.middleware');
const validateScenario = require('../middleware/validateScenario.middleware');
const triggerRateLimiter = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Public, unauthenticated route for QR-scanned ground-staff mobile cards.
// Mounted BEFORE the authMiddleware gate below on purpose.
router.get(
  '/simulation/:simulationId/public',
  SimulationController.getPublicRecord
);

// Apply auth protection to all remaining simulation routes
router.use(authMiddleware);

// Synchronous triggering route
router.post(
  '/simulation-trigger',
  requireFullAccess,
  triggerRateLimiter,
  validateScenario,
  SimulationController.trigger
);

// SSE Streaming triggering route
router.post(
  '/simulation-trigger/stream',
  requireFullAccess,
  triggerRateLimiter,
  validateScenario,
  SimulationController.triggerStream
);

// Escalate an active crisis to the next severity level
router.post(
  '/simulation-trigger/escalate',
  requireFullAccess,
  triggerRateLimiter,
  SimulationController.escalate
);

// Predictive risk forecast (pre-crisis)
router.post(
  '/simulation-trigger/predict',
  requireFullAccess,
  triggerRateLimiter,
  SimulationController.predict
);

// Manual/system crisis timeline note
router.post(
  '/simulation/:simulationId/timeline',
  requireFullAccess,
  SimulationController.addTimelineEntry
);

// History retrieval route
router.get(
  '/simulation-history',
  validateScenario,
  SimulationController.getHistory
);

module.exports = router;
