function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class === 'person') return [];

  const { sizeRatioHigh, sizeRatioLow, mediumRiskLevel, highRiskLevel } = config.improperStacking;
  const incidents = [];

  // Group by stacked_on_track_id
  let currentStackedOn = null;
  let runStartIdx = -1;
  let ratios = [];

  for (let i = 0; i < trackSeries.length; i++) {
    const data = trackSeries[i];
    const stackedOn = data.stacked_on_track_id;

    if (stackedOn != null) {
      if (currentStackedOn !== stackedOn) {
        // Evaluate previous run
        evaluateRun();
        currentStackedOn = stackedOn;
        runStartIdx = i;
        ratios = [];
      }
      if (data.relative_size_vs_stacked != null) {
        ratios.push(data.relative_size_vs_stacked);
      }
    } else {
      evaluateRun();
      currentStackedOn = null;
    }

    function evaluateRun() {
      if (currentStackedOn != null && ratios.length > 0) {
        ratios.sort((a, b) => a - b);
        const medianRatio = ratios[Math.floor(ratios.length / 2)];
        
        let riskLevel = null;
        if (medianRatio > sizeRatioHigh) riskLevel = highRiskLevel;
        else if (medianRatio < sizeRatioLow) riskLevel = mediumRiskLevel;

        if (riskLevel) {
          const startData = trackSeries[runStartIdx];
          const endData = trackSeries[i - 1]; // Previous frame before change
          incidents.push({
            video_id: videoId,
            behaviour: 'improperStacking',
            track_id: trackSeries[0].track_id,
            frame_start: startData.frame,
            frame_end: endData.frame,
            timestamp_start_sec: startData.timestamp_sec,
            timestamp_end_sec: endData.timestamp_sec,
            risk_level: riskLevel,
            confidence: 0.8,
            evidence: {
              relative_size_vs_stacked: medianRatio,
              stacked_on_track_id: currentStackedOn,
              trigger_rule: 'improperStacking.js'
            }
          });
        }
      }
    }
  }
  // Evaluate any remaining run at the end
  if (currentStackedOn != null && ratios.length > 0) {
    const ratiosSorted = [...ratios].sort((a, b) => a - b);
    const medianRatio = ratiosSorted[Math.floor(ratiosSorted.length / 2)];
    let riskLevel = null;
    if (medianRatio > sizeRatioHigh) riskLevel = highRiskLevel;
    else if (medianRatio < sizeRatioLow) riskLevel = mediumRiskLevel;

    if (riskLevel) {
      const startData = trackSeries[runStartIdx];
      const endData = trackSeries[trackSeries.length - 1];
      incidents.push({
        video_id: videoId,
        behaviour: 'improperStacking',
        track_id: trackSeries[0].track_id,
        frame_start: startData.frame,
        frame_end: endData.frame,
        timestamp_start_sec: startData.timestamp_sec,
        timestamp_end_sec: endData.timestamp_sec,
        risk_level: riskLevel,
        confidence: 0.8,
        evidence: {
          relative_size_vs_stacked: medianRatio,
          stacked_on_track_id: currentStackedOn,
          trigger_rule: 'improperStacking.js'
        }
      });
    }
  }

  return incidents;
}

module.exports = { detect };
