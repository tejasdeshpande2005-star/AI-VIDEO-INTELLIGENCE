const fs = require('fs');
const path = require('path');
const trackBufferService = require('../trackBufferService');
const scoreCalculator = require('./scoreCalculator');
const Incident = require('../../models/Incident');
const alertService = require('../alertService');
const config = require('../../config/riskThresholds');
const logger = require('../../utils/logger');

// Load all rules
const rulesDir = path.join(__dirname, 'rules');
const rules = [];

if (fs.existsSync(rulesDir)) {
  const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const ruleModule = require(path.join(rulesDir, file));
    if (typeof ruleModule.detect === 'function') {
      rules.push(ruleModule);
    }
  }
}

function analyze(videoId) {
  logger.info(`Running risk engine for video ${videoId}`);
  const allTracks = trackBufferService.getAllTracks(videoId);
  
  let rawIncidents = [];

  for (const [trackId, series] of allTracks.entries()) {
    const sortedSeries = series.sort((a, b) => a.frame - b.frame);
    
    for (const rule of rules) {
      try {
        const findings = rule.detect(sortedSeries, allTracks, config, videoId);
        if (findings && findings.length > 0) {
          rawIncidents = rawIncidents.concat(findings);
        }
      } catch (err) {
        logger.error(`Error running rule on track ${trackId} in video ${videoId}`, { error: err.message });
      }
    }
  }

  const finalIncidents = scoreCalculator.mergeAndScore(rawIncidents);
  
  const savedIncidents = [];
  for (const incident of finalIncidents) {
    const saved = Incident.create(incident);
    savedIncidents.push(saved);

    if (saved.risk_level === 'High' || saved.risk_level === 'Critical') {
      alertService.emit(saved);
    }
  }

  logger.info(`Risk engine finished. Found ${finalIncidents.length} incidents.`);
  return finalIncidents;
}

module.exports = {
  analyze
};
