import axios from 'axios';

const api = axios.create({
  baseURL: '/api/incidents'
});

export const getIncidents = async (filters = {}) => {
  const { data } = await api.get('/', { params: filters });
  return data;
};

export const getIncident = async (id) => {
  const { data } = await api.get(`/${id}`);
  return data;
};

export const markReviewed = async (id) => {
  const { data } = await api.patch(`/${id}/review`);
  return data;
};

export const getIncidentStats = async (videoId) => {
  // We compute locally in the hook for now, or you can use an endpoint if available
  const data = await getIncidents({ video_id: videoId });
  return data; // just returning the array to be computed
};
