require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  cvEventsPath: process.env.CV_EVENTS_PATH || '../cv-module/data/processed_events',
  cvVideoPath: process.env.CV_VIDEO_PATH || '../cv-module/data/demo_output',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  dbPath: process.env.DB_PATH || './data/warehouse.db',
  logLevel: process.env.LOG_LEVEL || 'info',
};
