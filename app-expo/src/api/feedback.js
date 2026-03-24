import api from './client';

export const sendFeedbackAPI = (data) => api.post('/feedback', data);
