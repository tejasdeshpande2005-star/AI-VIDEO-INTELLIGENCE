import axios from 'axios';

export const askQuestion = async (question, videoId) => {
  const { data } = await axios.post('/api/assistant/query', {
    question,
    video_id: videoId
  });
  return data;
};
