const cvIngestService = require('../services/cvIngestService');
const path = require('path');
const config = require('../config/env');

async function ingestAllFiles(req, res, next) {
  try {
    const results = await cvIngestService.ingestAll();
    res.json({ success: true, processed: results.length, details: results });
  } catch (error) {
    next(error);
  }
}

async function ingestSingleFile(req, res, next) {
  try {
    const { videoId } = req.params;
    const jsonlPath = path.join(config.cvEventsPath, `${videoId}.jsonl`);
    const result = await cvIngestService.ingestFile(jsonlPath, videoId);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ingestAllFiles,
  ingestSingleFile
};
