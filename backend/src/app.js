const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const ingestRoutes = require('./routes/ingest.routes');
const eventsRoutes = require('./routes/events.routes');
const incidentsRoutes = require('./routes/incidents.routes');
const assistantRoutes = require('./routes/assistant.routes');
const videosRoutes = require('./routes/videos.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static videos
app.use('/videos', express.static(path.resolve(__dirname, '..', config.cvVideoPath)));

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/videos', videosRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
