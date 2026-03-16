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

export const uploadAvatarAPI = async (imageUri) => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('avatar', { uri: imageUri, name: filename, type });
  return api.put('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
