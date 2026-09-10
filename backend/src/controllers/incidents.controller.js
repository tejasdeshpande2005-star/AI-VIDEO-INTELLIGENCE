const Incident = require('../models/Incident');

function listIncidents(req, res, next) {
  try {
    const filters = req.validated || req.query;
    const incidents = Incident.findAll(filters);
    res.json(incidents);
  } catch (error) {
    next(error);
  }
}

function getIncident(req, res, next) {
  try {
    const incident = Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
}

function reviewIncident(req, res, next) {
  try {
    const success = Incident.markReviewed(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listIncidents,
  getIncident,
  reviewIncident
};
