import api, { API_URL } from './client';

// Use raw fetch for register/login to avoid axios interceptor issues on Safari
export const registerAPI = async (name, email, password, phone, role, address, guardianProfile) => {
  const body = { name, email, password, phone, role };
  if (address) body.address = address;
  if (guardianProfile) body.guardianProfile = guardianProfile;

  let res;
  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    const error = new Error('Network error');
    error.userMessage = 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
    throw error;
  }

  const data = await res.json();
  if (!res.ok) {
    const error = new Error('Register failed');
    error.response = { data, status: res.status };
    throw error;
  }
  return { data };
};

export const loginAPI = async (email, password) => {
  let res;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (networkErr) {
    const error = new Error('Network error');
    error.userMessage = 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
    throw error;
  }

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

export const uploadAvatarAPI = async (base64Data) => {
  // base64Data should be the raw base64 string from image picker
  const avatar = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  return api.put('/users/me/avatar', { avatar });
};
