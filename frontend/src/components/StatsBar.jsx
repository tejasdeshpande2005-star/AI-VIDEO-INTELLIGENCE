import React from 'react';
import './StatsBar.css';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-bar">
      <div className="stat-item total">
        <span className="stat-label">Total</span>
        <span className="stat-value">{stats.total || 0}</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item critical">
        <span className="stat-label">Critical</span>
        <span className="stat-value">{stats.Critical || 0}</span>
      </div>
      <div className="stat-item high">
        <span className="stat-label">High</span>
        <span className="stat-value">{stats.High || 0}</span>
      </div>
      <div className="stat-item medium">
        <span className="stat-label">Medium</span>
        <span className="stat-value">{stats.Medium || 0}</span>
      </div>
      <div className="stat-item low">
        <span className="stat-label">Low</span>
        <span className="stat-value">{stats.Low || 0}</span>
      </div>
    </div>
  );
}
