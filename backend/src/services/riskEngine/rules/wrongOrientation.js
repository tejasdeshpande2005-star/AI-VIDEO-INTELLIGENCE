function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  const trackClass = trackSeries[0].class;
  const { expectedAspectRatioRange, applicableClasses, lowDeviationThreshold, lowRiskLevel, mediumRiskLevel } = config.wrongOrientation;
  
  if (!applicableClasses.includes(trackClass)) return [];

  let framesOutside = 0;
  let totalDeviation = 0;
  let totalFramesWithAr = 0;
  let sumAr = 0;

  for (const data of trackSeries) {
    if (data.aspect_ratio != null) {
      totalFramesWithAr++;
      sumAr += data.aspect_ratio;
      if (data.aspect_ratio < expectedAspectRatioRange[0] || data.aspect_ratio > expectedAspectRatioRange[1]) {
        framesOutside++;
        let dev = 0;
        if (data.aspect_ratio < expectedAspectRatioRange[0]) dev = expectedAspectRatioRange[0] - data.aspect_ratio;
        else dev = data.aspect_ratio - expectedAspectRatioRange[1];
        totalDeviation += dev;
      }
    }
  }

  if (totalFramesWithAr > 0 && framesOutside > totalFramesWithAr * 0.5) {
    const avgAr = sumAr / totalFramesWithAr;
    const avgDev = totalDeviation / framesOutside;
    const risk = avgDev > lowDeviationThreshold ? mediumRiskLevel : lowRiskLevel;

    return [{
      video_id: videoId,
      behaviour: 'wrongOrientation',
      track_id: trackSeries[0].track_id,
      frame_start: trackSeries[0].frame,
      frame_end: trackSeries[trackSeries.length - 1].frame,
      timestamp_start_sec: trackSeries[0].timestamp_sec,
      timestamp_end_sec: trackSeries[trackSeries.length - 1].timestamp_sec,
      risk_level: risk,
      confidence: 0.85,
      evidence: {
        avg_aspect_ratio: avgAr,
        expected_range: expectedAspectRatioRange,
        frames_outside_range: framesOutside,
        trigger_rule: 'wrongOrientation.js'
      }
    }];
  }

  return [];
}

module.exports = { detect };
