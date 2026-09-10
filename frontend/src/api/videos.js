import axios from 'axios';

export const getVideos = async () => {
  try {
    const { data } = await axios.get('/api/videos');
    return data;
  } catch (error) {
    console.error("Failed to fetch videos, returning defaults", error);
    return ['video1', 'video2'];
  }
};

export const getVideoUrl = (videoId) => {
  return `/videos/${videoId}_annotated.mp4`;
};

export const triggerIngest = async (videoId) => {
  const url = videoId ? `/api/ingest/${videoId}` : '/api/ingest/all';
  const { data } = await axios.post(url);
  return data;
};
