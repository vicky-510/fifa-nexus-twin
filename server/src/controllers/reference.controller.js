const { getAllStadiums, getStadiumById } = require('../data/stadiums.data');
const { getAllMatches, getMatchesByStadium } = require('../data/matches.data');
const { CRISIS_SCENARIOS, getScenariosForStadium } = require('../data/crisisScenarios.data');

const ReferenceController = {
  getStadiums(req, res) {
    return res.json(getAllStadiums());
  },

  getStadiumById(req, res) {
    const stadium = getStadiumById(req.params.id);
    if (!stadium) {
      return res.status(404).json({ error: `Stadium not found: ${req.params.id}` });
    }
    return res.json(stadium);
  },

  getMatches(req, res) {
    return res.json(getAllMatches());
  },

  getMatchesByStadium(req, res) {
    return res.json(getMatchesByStadium(req.params.stadiumId));
  },

  getScenarios(req, res) {
    return res.json(CRISIS_SCENARIOS);
  },

  getScenariosByStadium(req, res) {
    const stadium = getStadiumById(req.params.stadiumId);
    if (!stadium) {
      return res.status(404).json({ error: `Stadium not found: ${req.params.stadiumId}` });
    }
    return res.json(getScenariosForStadium(stadium.availableCrisisIds));
  }
};

module.exports = ReferenceController;
