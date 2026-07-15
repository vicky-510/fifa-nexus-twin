const express = require('express');
const ReferenceController = require('../controllers/reference.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/stadiums', ReferenceController.getStadiums);
router.get('/stadiums/:id', ReferenceController.getStadiumById);
router.get('/matches', ReferenceController.getMatches);
router.get('/matches/:stadiumId', ReferenceController.getMatchesByStadium);
router.get('/scenarios', ReferenceController.getScenarios);
router.get('/scenarios/:stadiumId', ReferenceController.getScenariosByStadium);

module.exports = router;
