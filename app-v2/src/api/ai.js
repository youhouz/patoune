import api from './client';

export const askAIAPI = (question, petContext, history) =>
  api.post('/ai/ask', { question, petContext, history });
