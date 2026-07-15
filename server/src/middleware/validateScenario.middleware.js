const { getAllScenarioIds } = require('../data/crisisScenarios.data');

function validateScenarioMiddleware(req, res, next) {
  const whitelistedScenarios = getAllScenarioIds();

  if (req.method === 'POST') {
    const { scenario } = req.body;
    if (!scenario || !whitelistedScenarios.includes(scenario)) {
      return res.status(400).json({
        error: `Invalid or missing scenario. Whitelist: ${whitelistedScenarios.join(', ')}`
      });
    }
  }

  if (req.method === 'GET' && req.query.scenario) {
    const { scenario } = req.query;
    if (!whitelistedScenarios.includes(scenario)) {
      return res.status(400).json({
        error: `Invalid scenario filter. Whitelist: ${whitelistedScenarios.join(', ')}`
      });
    }
  }

  next();
}

module.exports = validateScenarioMiddleware;
