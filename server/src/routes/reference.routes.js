const express = require('express');
const ReferenceController = require('../controllers/reference.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Reference data only changes at the day boundary (match/stadium status is
// derived from the date), so let clients cache it briefly. `private` because
// responses are tied to an Authorization header and must not be shared by
// intermediary caches.
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, max-age=300');
  next();
});

router.get('/stadiums', ReferenceController.getStadiums);
router.get('/stadiums/:id', ReferenceController.getStadiumById);
router.get('/matches', ReferenceController.getMatches);
router.get('/matches/:stadiumId', ReferenceController.getMatchesByStadium);
router.get('/scenarios', ReferenceController.getScenarios);
router.get('/scenarios/:stadiumId', ReferenceController.getScenariosByStadium);

module.exports = router;
