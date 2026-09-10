const buffers = new Map(); // videoId -> Map<trackId, Array<frameData>>
const classCache = new Map(); // videoId -> Map<trackId, classString>

function initVideo(videoId) {
  if (!buffers.has(videoId)) {
    buffers.set(videoId, new Map());
    classCache.set(videoId, new Map());
  }
}

function addFrame(videoId, frameEvent) {
  initVideo(videoId);
  const videoBuffer = buffers.get(videoId);
  const vClassCache = classCache.get(videoId);

  for (const obj of frameEvent.objects) {
    if (!videoBuffer.has(obj.track_id)) {
      videoBuffer.set(obj.track_id, []);
    }
    const trackSeries = videoBuffer.get(obj.track_id);
    
    trackSeries.push({
      ...obj,
      frame: frameEvent.frame,
      timestamp_sec: frameEvent.timestamp_sec
    });

    // Update class cache (naive common class - last seen for simplicity, usually static)
    vClassCache.set(obj.track_id, obj.class);
  }
}

function getTrackSeries(videoId, trackId) {
  const videoBuffer = buffers.get(videoId);
  if (!videoBuffer) return [];
  const series = videoBuffer.get(trackId);
  if (!series) return [];
  // Sort by frame to ensure order
  return series.sort((a, b) => a.frame - b.frame);
}

function getAllTracks(videoId) {
  return buffers.get(videoId) || new Map();
}

function getObjectsAtFrame(videoId, frame) {
  const videoBuffer = buffers.get(videoId);
  if (!videoBuffer) return [];
  
  const objects = [];
  for (const [trackId, series] of videoBuffer.entries()) {
    const obj = series.find(s => s.frame === frame);
    if (obj) {
      objects.push(obj);
    }
  }
  return objects;
}

function getTrackClass(videoId, trackId) {
  const vClassCache = classCache.get(videoId);
  if (!vClassCache) return null;
  return vClassCache.get(trackId) || null;
}

function clear(videoId) {
  buffers.delete(videoId);
  classCache.delete(videoId);
}

module.exports = {
  addFrame,
  getTrackSeries,
  getAllTracks,
  getObjectsAtFrame,
  getTrackClass,
  clear
};
