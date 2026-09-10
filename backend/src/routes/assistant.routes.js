const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistant.controller');

router.post('/query', assistantController.queryAssistant);

module.exports = router;
