const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingest.controller');

router.post('/all', ingestController.ingestAllFiles);
router.post('/:videoId', ingestController.ingestSingleFile);

module.exports = router;
