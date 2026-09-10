import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { getVideoUrl } from '../api/videos';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({ videoId }, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch(e => console.log('Auto-play prevented', e));
      }
    }
  }));

  if (!videoId) {
    return (
      <div className="video-player-placeholder">
        <p>Please select a video to view</p>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <video 
        ref={videoRef}
        src={getVideoUrl(videoId)} 
        controls 
        className="video-element"
      />
    </div>
  );
});

export default VideoPlayer;
