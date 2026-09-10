const trackBufferService = require('../services/trackBufferService');

function getEvents(req, res, next) {
  try {
    const { video_id, frame_start, frame_end } = req.query;
    if (!video_id) {
      return res.status(400).json({ error: 'video_id is required' });
    }

    const allTracks = trackBufferService.getAllTracks(video_id);
    const events = [];

    const fStart = frame_start ? parseInt(frame_start, 10) : 0;
    const fEnd = frame_end ? parseInt(frame_end, 10) : Number.MAX_SAFE_INTEGER;

    for (const [trackId, series] of allTracks.entries()) {
      for (const data of series) {
        if (data.frame >= fStart && data.frame <= fEnd) {
          events.push(data);
        }
      }
    }

    events.sort((a, b) => a.frame - b.frame);
    res.json(events);
  } catch (error) {
    next(error);
  }
}

module.exports = { getEvents };
