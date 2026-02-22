import api from './client';

export const loginAPI = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerAPI = (name, email, password, phone) =>
  api.post('/auth/register', { name, email, password, phone });

export const getMeAPI = () =>
  api.get('/auth/me');
