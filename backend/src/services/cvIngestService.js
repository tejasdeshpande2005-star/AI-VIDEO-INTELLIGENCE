const fs = require('fs');
const readline = require('readline');
const path = require('path');
const chokidar = require('chokidar');
const logger = require('../utils/logger');
const config = require('../config/env');
const trackBufferService = require('./trackBufferService');
const riskEngine = require('./riskEngine');
const Video = require('../models/Video');
const { FrameEventSchema } = require('../models/schema');

async function ingestFile(jsonlPath, videoId) {
  logger.info(`Starting ingestion for file: ${jsonlPath}`);
  
  if (!fs.existsSync(jsonlPath)) {
    throw new Error(`File not found: ${jsonlPath}`);
  }

  let framesProcessed = 0;
  let framesSkipped = 0;
  let maxFrame = 0;
  let maxTimestamp = 0;

  const fileStream = fs.createReadStream(jsonlPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      const result = FrameEventSchema.safeParse(parsed);
      
      if (!result.success) {
        logger.warn(`Validation failed for frame on line ${framesProcessed + framesSkipped + 1}`, { errors: result.error.errors });
        framesSkipped++;
        continue;
      }
      
      const frameEvent = result.data;
      trackBufferService.addFrame(videoId, frameEvent);
      
      if (frameEvent.frame > maxFrame) maxFrame = frameEvent.frame;
      if (frameEvent.timestamp_sec > maxTimestamp) maxTimestamp = frameEvent.timestamp_sec;
      
      framesProcessed++;
    } catch (e) {
      logger.warn(`Failed to parse line ${framesProcessed + framesSkipped + 1}`, { error: e.message });
      framesSkipped++;
    }
  }

  logger.info(`File read complete. Processed: ${framesProcessed}, Skipped: ${framesSkipped}. Running risk engine...`);
  
  const incidentsFound = riskEngine.analyze(videoId);
  
  Video.upsert({
    video_id: videoId,
    filename: path.basename(jsonlPath),
    jsonl_path: jsonlPath,
    video_path: path.join(config.cvVideoPath, `${videoId}.mp4`),
    frame_count: maxFrame,
    duration_sec: maxTimestamp,
    incident_count: incidentsFound.length
  });

  trackBufferService.clear(videoId);

  return { videoId, framesProcessed, framesSkipped, incidentsFound: incidentsFound.length };
}

async function ingestAll() {
  const dir = config.cvEventsPath;
  if (!fs.existsSync(dir)) {
    logger.warn(`CV events path does not exist: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  const results = [];

  for (const file of files) {
    const videoId = path.basename(file, '.jsonl');
    const fullPath = path.join(dir, file);
    try {
      const result = await ingestFile(fullPath, videoId);
      results.push(result);
    } catch (error) {
      logger.error(`Error ingesting file ${file}`, { error: error.message });
    }
  }

  return results;
}

function watchDirectory() {
  const dir = config.cvEventsPath;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const watcher = chokidar.watch(dir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    if (filePath.endsWith('.jsonl')) {
      logger.info(`New file detected: ${filePath}`);
      const videoId = path.basename(filePath, '.jsonl');
      try {
        await ingestFile(filePath, videoId);
      } catch (e) {
        logger.error(`Error auto-ingesting file ${filePath}`, { error: e.message });
      }
    }
  });

  logger.info(`Watching directory for new JSONL files: ${dir}`);
}

module.exports = {
  ingestFile,
  ingestAll,
  watchDirectory
};
