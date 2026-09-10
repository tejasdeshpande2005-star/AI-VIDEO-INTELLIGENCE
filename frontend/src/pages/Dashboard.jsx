import React, { useState, useRef, useEffect } from 'react';
import { getVideos, triggerIngest } from '../api/videos';
import useIncidents from '../hooks/useIncidents';
import VideoPlayer from '../components/VideoPlayer';
import IncidentTimeline from '../components/IncidentTimeline';
import RiskHeatmap from '../components/RiskHeatmap';
import ChatAssistant from '../components/ChatAssistant';
import StatsBar from '../components/StatsBar';
import './Dashboard.css';

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [filters, setFilters] = useState({});
  const videoPlayerRef = useRef(null);

  const { incidents, stats } = useIncidents({ ...filters, video_id: selectedVideoId || undefined });

  useEffect(() => {
    getVideos().then(vids => {
      setVideos(vids);
      if (vids.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vids[0]);
      }
    });
  }, []);

  const handleIncidentClick = (incident) => {
    if (videoPlayerRef.current && incident.timestamp_start_sec !== undefined) {
      videoPlayerRef.current.seekTo(incident.timestamp_start_sec);
    }
  };

  const handleIngest = async () => {
    try {
      await triggerIngest(selectedVideoId);
      alert('Ingest triggered!');
    } catch (e) {
      alert('Ingest failed');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="video-selector">
          <label>Select Video:</label>
          <select 
            value={selectedVideoId} 
            onChange={(e) => setSelectedVideoId(e.target.value)}
          >
            <option value="">All Videos</option>
            {videos.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="ingest-btn" onClick={handleIngest}>Run Analysis</button>
      </div>
      
      <StatsBar stats={stats} />

      <div className="dashboard-grid">
        <div className="grid-cell video-cell">
          <VideoPlayer ref={videoPlayerRef} videoId={selectedVideoId} />
        </div>
        <div className="grid-cell timeline-cell">
          <IncidentTimeline incidents={incidents} onIncidentClick={handleIncidentClick} />
        </div>
        <div className="grid-cell heatmap-cell">
          <RiskHeatmap incidents={incidents} />
        </div>
        <div className="grid-cell chat-cell">
          <ChatAssistant videoId={selectedVideoId} />
        </div>
      </div>
    </div>
  );
}
