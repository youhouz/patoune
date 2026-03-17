import api from './client';

export const searchGlobalAPI = (q) =>
  api.get('/search', { params: { q } });
