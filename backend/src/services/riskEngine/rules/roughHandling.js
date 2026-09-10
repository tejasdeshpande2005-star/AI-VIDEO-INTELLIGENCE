function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class === 'person') return [];

  const { peakVelocityThreshold, impactWindowFrames, defaultRiskLevel, withImpactRiskLevel } = config.roughHandling;
  const incidents = [];

  let i = 0;
  while (i < trackSeries.length) {
    const data = trackSeries[i];
    if (data.velocity_px_s) {
      const mag = Math.sqrt(Math.pow(data.velocity_px_s[0], 2) + Math.pow(data.velocity_px_s[1], 2));
      if (mag > peakVelocityThreshold) {
        let hadImpact = false;
        let impactFrameData = null;

        for (let j = i + 1; j <= i + impactWindowFrames && j < trackSeries.length; j++) {
          const nextData = trackSeries[j];
          if (nextData.velocity_px_s) {
            const nextMag = Math.sqrt(Math.pow(nextData.velocity_px_s[0], 2) + Math.pow(nextData.velocity_px_s[1], 2));
            // Sudden velocity drop => impact
            if (nextMag < mag * 0.2) { 
              hadImpact = true;
              impactFrameData = nextData;
              break;
            }
          }
        }

        const risk = hadImpact ? withImpactRiskLevel : defaultRiskLevel;
        const endData = impactFrameData || trackSeries[Math.min(i + impactWindowFrames, trackSeries.length - 1)];

        incidents.push({
          video_id: videoId,
          behaviour: 'roughHandling',
          track_id: data.track_id,
          frame_start: data.frame,
          frame_end: endData.frame,
          timestamp_start_sec: data.timestamp_sec,
          timestamp_end_sec: endData.timestamp_sec,
          risk_level: risk,
          confidence: hadImpact ? 0.95 : 0.8,
          evidence: {
            peak_velocity_magnitude: mag,
            had_impact: hadImpact,
            trigger_rule: 'roughHandling.js'
          }
        });
        i += impactWindowFrames; // skip ahead
        continue;
      }
    }
    i++;
  }
  return incidents;
}

module.exports = { detect };
