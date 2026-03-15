import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEFAULT_PROD_API_URL = 'https://pepete-fr.vercel.app/api';

const getFallbackApiUrl = () => {
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return DEFAULT_PROD_API_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const API_URL = (process.env.EXPO_PUBLIC_API_URL || getFallbackApiUrl()).replace(/\/+$/, '');
console.log('[API] URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only clear auth if there was a token — don't affect guest sessions
      const hadToken = await AsyncStorage.getItem('token');
      if (hadToken) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
    }

    if (!error.response) {
      console.error('[API] Serveur injoignable:', API_URL, error.message);
      error.userMessage = 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
    } else if (error.response.status >= 500) {
      console.error('[API] Erreur serveur:', error.response.status, error.response.data);
      error.userMessage = 'Le serveur rencontre un problème temporaire. Réessaie dans un instant.';
    }

    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
