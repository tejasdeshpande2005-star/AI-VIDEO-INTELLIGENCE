function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length < 2) return [];
  if (trackSeries[0].class === 'person') return [];

  const { minOscillationFrames, positionDeltaThreshold, aspectRatioDeltaThreshold, riskLevel } = config.unstableStacking;
  const incidents = [];

  let isStacked = false;
  let oscCount = 0;
  let maxPosDelta = 0;
  let maxArDelta = 0;
  let lastPosSignX = 0;
  let startOscIdx = -1;

  for (let i = 1; i < trackSeries.length; i++) {
    const curr = trackSeries[i];
    const prev = trackSeries[i - 1];

    if (curr.stacked_on_track_id != null && prev.stacked_on_track_id != null) {
      if (curr.center && prev.center && curr.aspect_ratio != null && prev.aspect_ratio != null) {
        const dx = curr.center[0] - prev.center[0];
        const dAR = Math.abs(curr.aspect_ratio - prev.aspect_ratio);

        if (Math.abs(dx) > positionDeltaThreshold || dAR > aspectRatioDeltaThreshold) {
          const signX = Math.sign(dx);
          if (signX !== 0 && signX !== lastPosSignX) {
            oscCount++;
            lastPosSignX = signX;
          }
          maxPosDelta = Math.max(maxPosDelta, Math.abs(dx));
          maxArDelta = Math.max(maxArDelta, dAR);
          
          if (startOscIdx === -1) startOscIdx = i - 1;
        } else {
          checkOscillation();
        }
      }
    } else {
      checkOscillation();
    }

    function checkOscillation() {
      if (oscCount >= minOscillationFrames) {
        const startData = trackSeries[startOscIdx];
        const endData = trackSeries[i - 1];
        incidents.push({
          video_id: videoId,
          behaviour: 'unstableStacking',
          track_id: trackSeries[0].track_id,
          frame_start: startData.frame,
          frame_end: endData.frame,
          timestamp_start_sec: startData.timestamp_sec,
          timestamp_end_sec: endData.timestamp_sec,
          risk_level: riskLevel,
          confidence: 0.9,
          evidence: {
            oscillation_count: oscCount,
            max_position_delta: maxPosDelta,
            max_aspect_ratio_delta: maxArDelta,
            trigger_rule: 'unstableStacking.js'
          }
        });
      }
      // Reset
      oscCount = 0;
      maxPosDelta = 0;
      maxArDelta = 0;
      lastPosSignX = 0;
      startOscIdx = -1;
    }
  }

  // Check at end
  if (oscCount >= minOscillationFrames && startOscIdx !== -1) {
    const startData = trackSeries[startOscIdx];
    const endData = trackSeries[trackSeries.length - 1];
    incidents.push({
      video_id: videoId,
      behaviour: 'unstableStacking',
      track_id: trackSeries[0].track_id,
      frame_start: startData.frame,
      frame_end: endData.frame,
      timestamp_start_sec: startData.timestamp_sec,
      timestamp_end_sec: endData.timestamp_sec,
      risk_level: riskLevel,
      confidence: 0.9,
      evidence: {
        oscillation_count: oscCount,
        max_position_delta: maxPosDelta,
        max_aspect_ratio_delta: maxArDelta,
        trigger_rule: 'unstableStacking.js'
      }
    });
  }

  return incidents;
}

module.exports = { detect };
