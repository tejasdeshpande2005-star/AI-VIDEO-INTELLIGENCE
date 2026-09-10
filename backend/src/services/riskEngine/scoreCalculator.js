const { v4: uuidv4 } = require('uuid');

const RISK_SCORES = {
  'Low': 1,
  'Medium': 2,
  'High': 3,
  'Critical': 4
};

function getHighestRisk(risk1, risk2) {
  return RISK_SCORES[risk1] >= RISK_SCORES[risk2] ? risk1 : risk2;
}

function mergeAndScore(rawIncidents) {
  // Group by (video_id, track_id)
  const grouped = new Map();

  for (const inc of rawIncidents) {
    const key = `${inc.video_id}_${inc.track_id}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(inc);
  }

  const finalIncidents = [];

  for (const [key, incidents] of grouped.entries()) {
    if (incidents.length === 1) {
      const inc = incidents[0];
      inc.incident_id = `inc_${uuidv4().substring(0, 8)}`;
      finalIncidents.push(inc);
      continue;
    }

    // Sort by start frame
    incidents.sort((a, b) => a.frame_start - b.frame_start);

    let merged = [];
    let current = { ...incidents[0] };
    current.evidence = [current.evidence];

    for (let i = 1; i < incidents.length; i++) {
      const next = incidents[i];

      // Overlap or close enough (e.g., within 30 frames)
      if (next.frame_start <= current.frame_end + 30) {
        current.frame_end = Math.max(current.frame_end, next.frame_end);
        current.timestamp_end_sec = Math.max(current.timestamp_end_sec, next.timestamp_end_sec);
        current.risk_level = getHighestRisk(current.risk_level, next.risk_level);
        
        if (!current.behaviour.includes(next.behaviour)) {
          current.behaviour = `${current.behaviour}+${next.behaviour}`;
        }
        current.confidence = Math.max(current.confidence, next.confidence);
        current.evidence.push(next.evidence);
      } else {
        merged.push(current);
        current = { ...next };
        current.evidence = [current.evidence];
      }
    }
    merged.push(current);

    for (const m of merged) {
      m.incident_id = `inc_${uuidv4().substring(0, 8)}`;
      m.evidence = {
        trigger_rule: m.evidence.map(e => e.trigger_rule),
        merged_evidence: m.evidence
      };
      finalIncidents.push(m);
    }
  }

  return finalIncidents;
}

module.exports = { mergeAndScore };
