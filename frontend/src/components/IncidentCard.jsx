import React from 'react';
import { useNavigate } from 'react-router-dom';
import './IncidentCard.css';

export default function IncidentCard({ incident, onClick }) {
  const navigate = useNavigate();
  const risk = incident.risk_level || incident.risk || 'Low';
  const riskColorVar = `var(--risk-${risk.toLowerCase()})`;

  const formatTime = (sec) => {
    if (sec === undefined || sec === null) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const humanize = (str) => {
    if (!str) return 'Unknown';
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  };

  const handleDoubleClick = () => {
    if (incident.id || incident._id) {
      navigate(`/incidents/${incident.id || incident._id}`);
    }
  };

  return (
    <div 
      className="incident-card" 
      style={{ borderLeftColor: riskColorVar }}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      title="Double click for details"
    >
      <div className="ic-header">
        <span className="ic-behaviour">{humanize(incident.behaviour)}</span>
        <span className="ic-risk" style={{ backgroundColor: riskColorVar }}>{risk}</span>
      </div>
      <div className="ic-body">
        <div className="ic-time">
          🕒 {formatTime(incident.timestamp_start_sec)} - {formatTime(incident.timestamp_end_sec)}
        </div>
        <div className="ic-meta">
          <span>Track: {incident.track_id}</span>
          {incident.confidence && (
            <span>Conf: {(incident.confidence * 100).toFixed(0)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
