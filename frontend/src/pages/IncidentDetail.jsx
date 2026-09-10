import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncident, markReviewed } from '../api/incidents';
import './IncidentDetail.css';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    getIncident(id).then(setIncident).catch(console.error);
  }, [id]);

  if (!incident) return <div className="loading">Loading...</div>;

  const handleReview = async () => {
    await markReviewed(id);
    setIncident({ ...incident, reviewed: true });
  };

  const riskColor = `var(--risk-${incident.risk_level?.toLowerCase() || 'low'})`;

  return (
    <div className="incident-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="detail-card">
        <div className="detail-header">
          <h2>Incident {incident.id || id}</h2>
          <div className="badges">
            <span className="badge risk-badge" style={{ backgroundColor: riskColor }}>
              {incident.risk_level || 'Low'} Risk
            </span>
            <span className="badge behaviour-badge">{incident.behaviour}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="info-grid">
            <div className="info-item">
              <label>Track ID</label>
              <span>{incident.track_id}</span>
            </div>
            <div className="info-item">
              <label>Time Range</label>
              <span>{incident.timestamp_start_sec?.toFixed(2)}s - {incident.timestamp_end_sec?.toFixed(2)}s</span>
            </div>
            <div className="info-item">
              <label>Frame Range</label>
              <span>{incident.frame_start} - {incident.frame_end}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span>{incident.reviewed ? 'Reviewed' : 'Pending'}</span>
            </div>
          </div>

          <div className="evidence-section">
            <h3>Evidence (JSON)</h3>
            <pre className="json-viewer">
              {JSON.stringify(incident.evidence, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="detail-actions">
          {!incident.reviewed && (
            <button className="btn-review" onClick={handleReview}>Mark as Reviewed</button>
          )}
        </div>
      </div>
    </div>
  );
}
