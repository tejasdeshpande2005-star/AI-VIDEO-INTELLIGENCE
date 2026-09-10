import { useState, useEffect, useCallback, useMemo } from 'react';
import { getIncidents } from '../api/incidents';
import useSocket from './useSocket';

export default function useIncidents(filters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const socket = useSocket();

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIncidents(filters);
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewIncident = (incident) => {
      // Basic check if it matches filter
      if (filters.video_id && incident.video_id !== filters.video_id) return;
      if (filters.risk && incident.risk !== filters.risk) return;
      
      setIncidents((prev) => [incident, ...prev].sort((a, b) => a.timestamp_start_sec - b.timestamp_start_sec));
      // Optional: show a toast notification here
    };

    socket.on('new_incident', handleNewIncident);
    return () => {
      socket.off('new_incident', handleNewIncident);
    };
  }, [socket, JSON.stringify(filters)]);

  const stats = useMemo(() => {
    const defaultStats = { total: 0, Critical: 0, High: 0, Medium: 0, Low: 0 };
    return incidents.reduce((acc, curr) => {
      acc.total += 1;
      const risk = curr.risk_level || curr.risk || 'Low';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, defaultStats);
  }, [incidents]);

  return { incidents, loading, error, stats, refresh: fetchIncidents };
}
