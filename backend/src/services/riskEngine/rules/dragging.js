function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class === 'person') return [];

  const { minHorizontalVelocity, verticalVelocityMax, minDurationFrames, minHeightConsistency, defaultRiskLevel, hazardZones, hazardRiskLevel } = config.dragging;
  
  const incidents = [];
  let dragStartIdx = -1;
  let heights = [];
  let horizontalVels = [];

  for (let i = 0; i < trackSeries.length; i++) {
    const data = trackSeries[i];
    let isDraggingFrame = false;

    if (data.velocity_px_s && data.height_px != null) {
      const vx = Math.abs(data.velocity_px_s[0]);
      const vy = Math.abs(data.velocity_px_s[1]);
      
      if (vx > minHorizontalVelocity && vy < verticalVelocityMax) {
        isDraggingFrame = true;
      }
    }

    if (isDraggingFrame) {
      if (dragStartIdx === -1) dragStartIdx = i;
      heights.push(data.height_px);
      horizontalVels.push(Math.abs(data.velocity_px_s[0]));
    } else {
      // Evaluate accumulated drag
      if (dragStartIdx !== -1) {
        const duration = i - dragStartIdx;
        if (duration >= minDurationFrames) {
          const minH = Math.min(...heights);
          const maxH = Math.max(...heights);
          const ratio = minH / maxH;
          
          if (ratio > minHeightConsistency) {
            const startData = trackSeries[dragStartIdx];
            const endData = trackSeries[i - 1];
            
            // Determine risk level based on zones traversed
            let riskLevel = defaultRiskLevel;
            let inHazardZone = false;
            for (let j = dragStartIdx; j < i; j++) {
              if (hazardZones.includes(trackSeries[j].in_zone)) {
                inHazardZone = true;
                riskLevel = hazardRiskLevel;
                break;
              }
            }
            
            const avgV = horizontalVels.reduce((a, b) => a + b, 0) / horizontalVels.length;

            incidents.push({
              video_id: videoId,
              behaviour: 'dragging',
              track_id: data.track_id,
              frame_start: startData.frame,
              frame_end: endData.frame,
              timestamp_start_sec: startData.timestamp_sec,
              timestamp_end_sec: endData.timestamp_sec,
              risk_level: riskLevel,
              confidence: 0.9,
              evidence: {
                avg_horizontal_velocity: avgV,
                sustained_frames: duration,
                in_zone: inHazardZone,
                trigger_rule: 'dragging.js'
              }
            });
          }
        }
        dragStartIdx = -1;
        heights = [];
        horizontalVels = [];
      }
    }
  }

  return incidents;
}

module.exports = { detect };
