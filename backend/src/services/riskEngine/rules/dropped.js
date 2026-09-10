function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  const trackClass = trackSeries[0].class;
  if (trackClass === 'person') return []; // Don't apply to persons

  const threshold = config.dropped.verticalVelocityThreshold;
  const stopWindow = config.dropped.stopWindowFrames;
  const incidents = [];
  
  let i = 0;
  while (i < trackSeries.length) {
    const frameData = trackSeries[i];
    if (frameData.velocity_px_s && frameData.velocity_px_s.length === 2) {
      const vy = frameData.velocity_px_s[1];
      
      if (vy > threshold) {
        // Look ahead for sudden stop
        let foundStop = false;
        let stopFrameData = null;
        for (let j = i + 1; j <= i + stopWindow && j < trackSeries.length; j++) {
          const nextData = trackSeries[j];
          if (nextData.velocity_px_s) {
            const nextMag = Math.sqrt(Math.pow(nextData.velocity_px_s[0], 2) + Math.pow(nextData.velocity_px_s[1], 2));
            if (nextMag < 5) { // Stop
              foundStop = true;
              stopFrameData = nextData;
              break;
            }
          }
        }
        
        if (foundStop) {
          incidents.push({
            video_id: videoId,
            behaviour: 'dropped',
            track_id: frameData.track_id,
            frame_start: frameData.frame,
            frame_end: stopFrameData.frame,
            timestamp_start_sec: frameData.timestamp_sec,
            timestamp_end_sec: stopFrameData.timestamp_sec,
            risk_level: config.dropped.riskLevel,
            confidence: 0.85,
            evidence: {
              peak_velocity_px_s: vy,
              impact_frame: stopFrameData.frame,
              trigger_rule: 'dropped.js'
            }
          });
          i += stopWindow; // skip ahead
          continue;
        }
      }
    }
    i++;
  }
  return incidents;
}

module.exports = { detect };
