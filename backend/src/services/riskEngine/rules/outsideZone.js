function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  const trackClass = trackSeries[0].class;
  if (trackClass === 'person') return [];

  const { designatedZones, riskLevel } = config.outsideZone;
  const allowedZones = designatedZones[trackClass];
  if (!allowedZones) return []; // No zone constraints for this class

  let framesOutside = 0;
  const inZoneValues = new Set();

  for (const data of trackSeries) {
    if (data.in_zone) inZoneValues.add(data.in_zone);
    if (!data.in_zone || !allowedZones.includes(data.in_zone)) {
      framesOutside++;
    }
  }

  if (framesOutside > trackSeries.length * 0.5) {
    return [{
      video_id: videoId,
      behaviour: 'outsideZone',
      track_id: trackSeries[0].track_id,
      frame_start: trackSeries[0].frame,
      frame_end: trackSeries[trackSeries.length - 1].frame,
      timestamp_start_sec: trackSeries[0].timestamp_sec,
      timestamp_end_sec: trackSeries[trackSeries.length - 1].timestamp_sec,
      risk_level: riskLevel,
      confidence: 0.9,
      evidence: {
        frames_outside_zone: framesOutside,
        total_frames: trackSeries.length,
        in_zone_values: Array.from(inZoneValues),
        trigger_rule: 'outsideZone.js'
      }
    }];
  }

  return [];
}

module.exports = { detect };
