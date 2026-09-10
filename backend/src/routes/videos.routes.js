const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

router.get('/', (req, res, next) => {
  try {
    const videos = Video.findAll();
    // Return array of video_id strings for the frontend dropdown
    const videoIds = videos.map(v => v.video_id);
    res.json(videoIds);
  } catch (error) {
    next(error);
  }
});

router.get('/:videoId', (req, res, next) => {
  try {
    const video = Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
