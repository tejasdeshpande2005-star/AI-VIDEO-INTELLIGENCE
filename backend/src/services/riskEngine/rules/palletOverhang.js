const trackBufferService = require('../../trackBufferService');

function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class === 'person' || trackSeries[0].class === 'pallet') return [];

  const { overhangToleranceRatio, riskLevel } = config.palletOverhang;
  const incidents = [];

  let overhangStartIdx = -1;
  let maxOverhangRatio = 0;
  let maxOverhangDir = '';

  for (let i = 0; i < trackSeries.length; i++) {
    const data = trackSeries[i];
    const stackedOn = data.stacked_on_track_id;

    if (stackedOn != null) {
      const stackedClass = trackBufferService.getTrackClass(videoId, stackedOn);
      if (stackedClass === 'pallet' && data.bbox_xyxy) {
        // Find pallet frame data
        const palletSeries = allTracks.get(stackedOn) || [];
        const palletData = palletSeries.find(p => p.frame === data.frame);

        if (palletData && palletData.bbox_xyxy) {
          const [bx1, by1, bx2, by2] = data.bbox_xyxy;
          const [px1, py1, px2, py2] = palletData.bbox_xyxy;
          
          const pWidth = px2 - px1;
          const pHeight = py2 - py1;
          
          const leftOverhang = Math.max(0, px1 - bx1) / pWidth;
          const rightOverhang = Math.max(0, bx2 - px2) / pWidth;
          const topOverhang = Math.max(0, py1 - by1) / pHeight;
          const bottomOverhang = Math.max(0, by2 - py2) / pHeight;

          const currentMaxRatio = Math.max(leftOverhang, rightOverhang, topOverhang, bottomOverhang);
          
          if (currentMaxRatio > overhangToleranceRatio) {
            if (overhangStartIdx === -1) overhangStartIdx = i;
            if (currentMaxRatio > maxOverhangRatio) {
              maxOverhangRatio = currentMaxRatio;
              if (currentMaxRatio === leftOverhang) maxOverhangDir = 'left';
              else if (currentMaxRatio === rightOverhang) maxOverhangDir = 'right';
              else if (currentMaxRatio === topOverhang) maxOverhangDir = 'top';
              else maxOverhangDir = 'bottom';
            }
          } else {
            checkOverhang(i - 1);
          }
        } else {
          checkOverhang(i - 1);
        }
      } else {
        checkOverhang(i - 1);
      }
    } else {
      checkOverhang(i - 1);
    }

    function checkOverhang(endIdx) {
      if (overhangStartIdx !== -1) {
        const startData = trackSeries[overhangStartIdx];
        const endData = trackSeries[endIdx];
        // Only trigger if sustained for a few frames
        if (endIdx - overhangStartIdx > 5) {
          incidents.push({
            video_id: videoId,
            behaviour: 'palletOverhang',
            track_id: trackSeries[0].track_id,
            frame_start: startData.frame,
            frame_end: endData.frame,
            timestamp_start_sec: startData.timestamp_sec,
            timestamp_end_sec: endData.timestamp_sec,
            risk_level: riskLevel,
            confidence: 0.85,
            evidence: {
              max_overhang_ratio: maxOverhangRatio,
              overhang_direction: maxOverhangDir,
              trigger_rule: 'palletOverhang.js'
            }
          });
        }
        overhangStartIdx = -1;
        maxOverhangRatio = 0;
      }
    }
  }

  checkOverhang(trackSeries.length - 1);

  return incidents;
}

module.exports = { detect };
