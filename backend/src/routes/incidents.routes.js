const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const validateRequest = require('../middleware/validateRequest');
const { QuerySchema } = require('../models/schema');

router.get('/', validateRequest(QuerySchema, 'query'), incidentsController.listIncidents);
router.get('/:id', incidentsController.getIncident);
router.patch('/:id/review', incidentsController.reviewIncident);

module.exports = router;
