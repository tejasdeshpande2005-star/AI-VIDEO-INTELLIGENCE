const llmService = require('../services/llmService');
const Incident = require('../models/Incident');
const logger = require('../utils/logger');

async function queryAssistant(req, res, next) {
  try {
    const { question, video_id } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const filters = { limit: 1000 };
    if (video_id) {
      filters.video_id = video_id;
    }
    
    const incidents = Incident.findAll(filters);
    
    const result = await llmService.queryAssistant(question, incidents);
    
    res.json({
      answer: result.answer,
      cited_incident_ids: result.cited_incident_ids,
      incident_count: incidents.length
    });
  } catch (error) {
    if (error.message.includes('API key')) {
      return res.status(503).json({ error: error.message });
    }
    next(error);
  }
}

module.exports = { queryAssistant };
