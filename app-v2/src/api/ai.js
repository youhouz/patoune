import api from './client';

export const askAIAPI = (question, petContext) =>
  api.post('/ai/ask', { question, petContext });
