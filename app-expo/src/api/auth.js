import api from './client';

export const loginAPI = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerAPI = (name, email, password, phone, role, address, guardianProfile) =>
  api.post('/auth/register', {
    name,
    email,
    password,
    phone,
    role,
    address,
    guardianProfile,
  });

export const getMeAPI = () =>
  api.get('/auth/me');
