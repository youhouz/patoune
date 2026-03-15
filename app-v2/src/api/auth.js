import api, { API_URL } from './client';

// Use raw fetch for register/login to avoid axios interceptor issues on Safari
export const registerAPI = async (name, email, password, phone, role, address, guardianProfile) => {
  const body = { name, email, password, phone, role };
  if (address) body.address = address;
  if (guardianProfile) body.guardianProfile = guardianProfile;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error('Register failed');
    error.response = { data, status: res.status };
    throw error;
  }
  return { data };
};

export const loginAPI = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error('Login failed');
    error.response = { data, status: res.status };
    throw error;
  }
  return { data };
};

export const getMeAPI = () =>
  api.get('/auth/me');
