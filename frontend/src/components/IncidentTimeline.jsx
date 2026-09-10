import React, { useState, useMemo } from 'react';
import IncidentCard from './IncidentCard';
import './IncidentTimeline.css';

export default function IncidentTimeline({ incidents, onIncidentClick }) {
  const [filter, setFilter] = useState('All');

  const filteredIncidents = useMemo(() => {
    if (filter === 'All') return incidents;
    return incidents.filter(i => (i.risk_level || i.risk) === filter);
  }, [incidents, filter]);

  const tabs = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>Incidents</h3>
        <div className="timeline-tabs">
          {tabs.map(t => (
            <button 
              key={t}
              className={`tab-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="timeline-list">
        {filteredIncidents.length === 0 ? (
          <p className="no-incidents">No incidents found.</p>
        ) : (
          filteredIncidents.map(inc => (
            <IncidentCard 
              key={inc.id || inc._id || Math.random()} 
              incident={inc} 
              onClick={() => onIncidentClick(inc)} 
            />
          ))
        )}
      </div>
    </div>
  );
}
