const logger = require('../utils/logger');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    logger.warn('Validation error', { errors: err.errors });
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
