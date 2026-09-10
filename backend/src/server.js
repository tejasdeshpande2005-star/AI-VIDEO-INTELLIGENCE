const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const { initDB } = require('./db');
const setupSocket = require('./sockets/alertSocket');
const logger = require('./utils/logger');
const cvIngestService = require('./services/cvIngestService');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize DB (async for sql.js), then start server
async function start() {
  try {
    await initDB();

    // Setup WebSocket
    setupSocket(io);

    // Start watcher
    cvIngestService.watchDirectory();

    // Start server
    server.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
