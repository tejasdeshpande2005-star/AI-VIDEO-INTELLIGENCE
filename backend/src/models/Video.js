const { getDB } = require('../db/index');

function upsert(video) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO videos (
      video_id, filename, jsonl_path, video_path, frame_count, duration_sec, incident_count
    ) VALUES (
      @video_id, @filename, @jsonl_path, @video_path, @frame_count, @duration_sec, @incident_count
    )
  `);
  stmt.run({
    video_id: video.video_id,
    filename: video.filename || null,
    jsonl_path: video.jsonl_path || null,
    video_path: video.video_path || null,
    frame_count: video.frame_count || 0,
    duration_sec: video.duration_sec || 0,
    incident_count: video.incident_count || 0
  });
  return video;
}

function findById(videoId) {
  const db = getDB();
  const stmt = db.prepare(`SELECT * FROM videos WHERE video_id = ?`);
  return stmt.get(videoId);
}

function findAll() {
  const db = getDB();
  const stmt = db.prepare(`SELECT * FROM videos ORDER BY ingested_at DESC`);
  return stmt.all();
}

function updateIncidentCount(videoId, count) {
  const db = getDB();
  const stmt = db.prepare(`UPDATE videos SET incident_count = ? WHERE video_id = ?`);
  stmt.run(count, videoId);
}

module.exports = {
  upsert,
  findById,
  findAll,
  updateIncidentCount
};
