const { getDB } = require('../db/index');

function create(incident) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO incidents (
      incident_id, video_id, behaviour, track_id,
      frame_start, frame_end, timestamp_start_sec, timestamp_end_sec,
      risk_level, confidence, evidence
    ) VALUES (
      @incident_id, @video_id, @behaviour, @track_id,
      @frame_start, @frame_end, @timestamp_start_sec, @timestamp_end_sec,
      @risk_level, @confidence, @evidence
    )
  `);
  const data = { ...incident, evidence: incident.evidence ? JSON.stringify(incident.evidence) : null };
  stmt.run(data);
  return incident;
}

function findById(id) {
  const db = getDB();
  const stmt = db.prepare(`SELECT * FROM incidents WHERE incident_id = ?`);
  const row = stmt.get(id);
  if (row && row.evidence) {
    try {
      row.evidence = JSON.parse(row.evidence);
    } catch (e) { }
  }
  return row;
}

function findAll(filters = {}) {
  const db = getDB();
  let query = `SELECT * FROM incidents WHERE 1=1`;
  const params = {};

  if (filters.video_id) {
    query += ` AND video_id = @video_id`;
    params.video_id = filters.video_id;
  }
  if (filters.risk_level || filters.risk) {
    query += ` AND risk_level = @risk_level`;
    params.risk_level = filters.risk_level || filters.risk;
  }
  if (filters.behaviour) {
    query += ` AND behaviour = @behaviour`;
    params.behaviour = filters.behaviour;
  }
  if (filters.from !== undefined) {
    query += ` AND timestamp_start_sec >= @from`;
    params.from = filters.from;
  }
  if (filters.to !== undefined) {
    query += ` AND timestamp_start_sec <= @to`;
    params.to = filters.to;
  }

  query += ` ORDER BY timestamp_start_sec DESC`;

  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  query += ` LIMIT @limit OFFSET @offset`;
  params.limit = limit;
  params.offset = offset;

  const stmt = db.prepare(query);
  const rows = stmt.all(params);
  return rows.map(row => {
    if (row.evidence) {
      try {
        row.evidence = JSON.parse(row.evidence);
      } catch (e) { }
    }
    return row;
  });
}

function countByBehaviour(videoId) {
  const db = getDB();
  let query = `SELECT behaviour, COUNT(*) as count FROM incidents`;
  const params = {};
  if (videoId) {
    query += ` WHERE video_id = @video_id`;
    params.video_id = videoId;
  }
  query += ` GROUP BY behaviour`;
  return db.prepare(query).all(params);
}

function countByRisk(videoId) {
  const db = getDB();
  let query = `SELECT risk_level, COUNT(*) as count FROM incidents`;
  const params = {};
  if (videoId) {
    query += ` WHERE video_id = @video_id`;
    params.video_id = videoId;
  }
  query += ` GROUP BY risk_level`;
  return db.prepare(query).all(params);
}

function markReviewed(id) {
  const db = getDB();
  const stmt = db.prepare(`UPDATE incidents SET reviewed = 1 WHERE incident_id = ?`);
  const info = stmt.run(id);
  return info.changes > 0;
}

module.exports = {
  create,
  findById,
  findAll,
  countByBehaviour,
  countByRisk,
  markReviewed
};
