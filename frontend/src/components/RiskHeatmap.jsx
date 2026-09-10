import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './RiskHeatmap.css';

export default function RiskHeatmap({ incidents }) {
  const data = useMemo(() => {
    const map = {};
    incidents.forEach(inc => {
      const b = inc.behaviour || 'Unknown';
      const r = inc.risk_level || inc.risk || 'Low';
      if (!map[b]) {
        map[b] = { behaviour: b, Critical: 0, High: 0, Medium: 0, Low: 0 };
      }
      map[b][r] += 1;
    });
    return Object.values(map);
  }, [incidents]);

  const colors = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#ca8a04',
    Low: '#16a34a'
  };

  return (
    <div className="heatmap-container">
      <h3>Behaviour × Risk Distribution</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
            <XAxis dataKey="behaviour" stroke="#a0a0a0" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
            <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0', fontSize: 12 }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a' }}
              itemStyle={{ color: '#e0e0e0' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }}/>
            <Bar dataKey="Critical" stackId="a" fill={colors.Critical} />
            <Bar dataKey="High" stackId="a" fill={colors.High} />
            <Bar dataKey="Medium" stackId="a" fill={colors.Medium} />
            <Bar dataKey="Low" stackId="a" fill={colors.Low} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
