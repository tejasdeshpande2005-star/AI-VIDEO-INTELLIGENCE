const trackBufferService = require('../../trackBufferService');

function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class !== 'person') return [];

  const { minDwellSec, targetClasses, riskLevel } = config.steppingOnCartons;
  const incidents = [];

  let overlapStartIdx = -1;
  let currentOverlapTrack = null;

  for (let i = 0; i < trackSeries.length; i++) {
    const data = trackSeries[i];
    const overlapTrack = data.foot_overlap_track_id;

    if (overlapTrack != null) {
      const overlapClass = trackBufferService.getTrackClass(videoId, overlapTrack);
      if (overlapClass && targetClasses.includes(overlapClass)) {
        if (overlapStartIdx === -1) {
          overlapStartIdx = i;
          currentOverlapTrack = overlapTrack;
        } else if (currentOverlapTrack !== overlapTrack) {
          checkOverlap(i - 1);
          overlapStartIdx = i;
          currentOverlapTrack = overlapTrack;
        }
      } else {
        if (overlapStartIdx !== -1) {
          checkOverlap(i - 1);
          overlapStartIdx = -1;
          currentOverlapTrack = null;
        }
      }
    } else {
      if (overlapStartIdx !== -1) {
        checkOverlap(i - 1);
        overlapStartIdx = -1;
        currentOverlapTrack = null;
      }
    }

    function checkOverlap(endIdx) {
      const startData = trackSeries[overlapStartIdx];
      const endData = trackSeries[endIdx];
      // Note: we can use data.dwell_time_sec or compute from timestamps
      const dwell = endData.timestamp_sec - startData.timestamp_sec;
      
      if (dwell >= minDwellSec || (endData.dwell_time_sec && endData.dwell_time_sec >= minDwellSec)) {
        incidents.push({
          video_id: videoId,
          behaviour: 'steppingOnCartons',
          track_id: trackSeries[0].track_id,
          frame_start: startData.frame,
          frame_end: endData.frame,
          timestamp_start_sec: startData.timestamp_sec,
          timestamp_end_sec: endData.timestamp_sec,
          risk_level: riskLevel,
          confidence: 0.9,
          evidence: {
            foot_overlap_track_id: currentOverlapTrack,
            overlapped_class: trackBufferService.getTrackClass(videoId, currentOverlapTrack),
            dwell_time_sec: dwell,
            trigger_rule: 'steppingOnCartons.js'
          }
        });
      }
    }
  }

  if (overlapStartIdx !== -1) {
    checkOverlap(trackSeries.length - 1);
  }

  return incidents;
}

module.exports = { detect };
