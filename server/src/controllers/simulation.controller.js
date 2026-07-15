const SimulationService = require('../services/simulation.service');
const GeminiService = require('../services/gemini.service');
const logger = require('../utils/logger');

const SimulationController = {
  /**
   * Triggers a synchronous simulation
   */
  async trigger(req, res, next) {
    try {
      const { scenario, stadiumId } = req.body;
      const dbRecord = await SimulationService.trigger(stadiumId, scenario);
      return res.status(201).json(dbRecord);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves simulation history (filtered by whitelisted scenario / stadium if provided)
   */
  async getHistory(req, res, next) {
    try {
      const { scenario, stadiumId } = req.query;
      const history = await SimulationService.getHistory(scenario, stadiumId);
      return res.json(history);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Escalates an existing simulation to the next severity level
   */
  async escalate(req, res, next) {
    try {
      const { simulationId } = req.body;
      const dbRecord = await SimulationService.escalate(simulationId);
      return res.status(201).json(dbRecord);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generates a predictive risk forecast for a stadium
   */
  async predict(req, res, next) {
    try {
      const { stadiumId } = req.body;
      const forecast = await SimulationService.predict(stadiumId);
      return res.json(forecast);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Public, unauthenticated lookup for QR-scanned ground-staff mobile cards.
   * Returns only the fields needed to render a role-specific directive card.
   */
  async getPublicRecord(req, res, next) {
    try {
      const { simulationId } = req.params;
      const record = await SimulationService.getPublicRecord(simulationId);
      if (!record) {
        return res.status(404).json({ error: 'Simulation record not found.' });
      }
      return res.json(record);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Appends a manual note or system entry to a simulation's crisis timeline
   */
  async addTimelineEntry(req, res, next) {
    try {
      const { simulationId } = req.params;
      const { type, message } = req.body;
      const dbRecord = await SimulationService.appendTimelineEntry(simulationId, { type, message });
      return res.status(201).json(dbRecord);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Triggers an SSE stream simulation
   */
  async triggerStream(req, res, next) {
    const { scenario, stadiumId } = req.body;

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    logger.info(`Starting SSE simulation stream for: ${stadiumId}/${scenario}`);

    let accumulatedText = '';
    let isClientConnected = true;

    req.on('close', () => {
      logger.info(`Client closed connection for stream simulation: ${stadiumId}/${scenario}`);
      isClientConnected = false;
    });

    try {
      const stream = await GeminiService.generateSimulationStream(stadiumId, scenario);

      for await (const chunk of stream) {
        if (!isClientConnected) {
          logger.warn(`Stream generation continuing, but client disconnected. Aborting database save.`);
          break;
        }

        const text = chunk.text || '';
        accumulatedText += text;

        // Write the token to the client
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      if (isClientConnected) {
        // Parse and persist the final accumulated JSON to PostgreSQL
        try {
          // Clean up markdown block format if Gemini wrapped the JSON (though responseSchema prevents it)
          let cleanJson = accumulatedText.trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
          }

          const parsedResult = JSON.parse(cleanJson);
          const dbRecord = await SimulationService.saveResult(stadiumId, scenario, parsedResult);

          logger.info(`Persisted streamed simulation to DB. ID: ${dbRecord.id}`);
          res.write(`data: ${JSON.stringify({ done: true, record: dbRecord })}\n\n`);
        } catch (parseErr) {
          logger.error('Failed to parse final streamed JSON for saving', parseErr);
          logger.error(`Raw text was: ${accumulatedText}`);
          res.write(`data: ${JSON.stringify({ error: 'Data parsing failed. Simulation was not saved to history.' })}\n\n`);
        }
      }
    } catch (streamErr) {
      logger.error('Error during simulation streaming', streamErr);
      if (isClientConnected) {
        res.write(`data: ${JSON.stringify({ error: 'Streaming execution encountered an error.' })}\n\n`);
      }
    } finally {
      res.end();
    }
  }
};

module.exports = SimulationController;
