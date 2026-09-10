const trackBufferService = require('../../trackBufferService');
// Simple dragging detection logic inline for wrongEquipment rule
function detect(trackSeries, allTracks, config, videoId) {
  if (!trackSeries || trackSeries.length === 0) return [];
  if (trackSeries[0].class === 'person') return [];

  const { riskLevel } = config.wrongEquipment;
  const incidents = [];
  
  let dragStartIdx = -1;
  let personNear = new Set();
  
  for (let i = 0; i < trackSeries.length; i++) {
    const data = trackSeries[i];
    let isDraggingFrame = false;

    if (data.velocity_px_s) {
      const vx = Math.abs(data.velocity_px_s[0]);
      const vy = Math.abs(data.velocity_px_s[1]);
      if (vx > 10 && vy < 5) { // Simple drag threshold
        isDraggingFrame = true;
      }
    }

    if (isDraggingFrame) {
      if (dragStartIdx === -1) dragStartIdx = i;
      if (data.near_person_track_ids) {
        data.near_person_track_ids.forEach(pid => personNear.add(pid));
      }
    } else {
      if (dragStartIdx !== -1) {
        const duration = i - dragStartIdx;
        if (duration > 20) { // Sustained drag
          checkEquipment(dragStartIdx, i - 1);
        }
        dragStartIdx = -1;
        personNear.clear();
      }
    }
  }

  if (dragStartIdx !== -1 && trackSeries.length - dragStartIdx > 20) {
    checkEquipment(dragStartIdx, trackSeries.length - 1);
  }

  function checkEquipment(startIdx, endIdx) {
    if (personNear.size === 0) return;
    
    // Check if any person associated with the drag has a trolley or cart nearby
    let foundEquipment = false;
    let personId = Array.from(personNear)[0];

    for (let pId of personNear) {
      const pSeries = allTracks.get(pId) || [];
      const relevantFrames = pSeries.filter(p => p.frame >= trackSeries[startIdx].frame && p.frame <= trackSeries[endIdx].frame);
      
      // Look at what's near the person (would need near_object_track_ids ideally, but we'll check all objects in scene)
      // Since CV module gives us objects, let's check if any object in the scene during these frames is a cart/trolley
      for (const f of relevantFrames) {
        const objs = trackBufferService.getObjectsAtFrame(videoId, f.frame);
        if (objs.some(o => o.class === 'cart' || o.class === 'trolley' || o.class === 'pallet_jack')) {
          foundEquipment = true;
          break;
        }
      }
      if (foundEquipment) break;
    }

    if (!foundEquipment) {
      const startData = trackSeries[startIdx];
      const endData = trackSeries[endIdx];
      incidents.push({
        video_id: videoId,
        behaviour: 'wrongEquipment',
        track_id: trackSeries[0].track_id,
        frame_start: startData.frame,
        frame_end: endData.frame,
        timestamp_start_sec: startData.timestamp_sec,
        timestamp_end_sec: endData.timestamp_sec,
        risk_level: riskLevel,
        confidence: 0.8,
        evidence: {
          dragging_track_id: trackSeries[0].track_id,
          person_track_id: personId,
          equipment_present: false,
          trigger_rule: 'wrongEquipment.js'
        }
      });
    }
  }

  return incidents;
}

module.exports = { detect };
