const logger = require('../utils/logger');
const alertService = require('../services/alertService');

function setupSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  alertService.init(io);
}

module.exports = setupSocket;
