const logger = require('../utils/logger');

let ioInstance = null;

function init(io) {
  ioInstance = io;
  logger.info('Alert service initialized with Socket.IO');
}

function emit(incident) {
  if (ioInstance && (incident.risk_level === 'High' || incident.risk_level === 'Critical')) {
    ioInstance.emit('new_incident', incident);
    logger.info(`Alert emitted for incident ${incident.incident_id} (${incident.risk_level})`);
  }
}

module.exports = { init, emit };
