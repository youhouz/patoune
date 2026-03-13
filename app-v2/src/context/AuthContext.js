import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAPI, registerAPI, getMeAPI } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const clearStoredAuth = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'userRole']);
    setToken(null);
    setUser(null);
  }, []);

  const saveAuth = useCallback(async (newToken, userData, role) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    if (role) {
      await AsyncStorage.setItem('userRole', role);
    }
    setToken(newToken);
    setUser(userData);
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (!storedToken) {
        return;
      }

      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (_) {
          // Corrupted JSON in storage — clear it
          await clearStoredAuth();
          return;
        }
      }

      // Skip server refresh for demo token
      if (storedToken === 'demo_token_pepete') {
        return;
      }

      // Refresh profile from server
      const response = await getMeAPI();
      const me = response.data?.user;
      if (me) {
        setUser(me);
        await AsyncStorage.setItem('user', JSON.stringify(me));
        return;
      }

      await clearStoredAuth();
    } catch (error) {
      console.log('Erreur verification auth:', error.message);
      await clearStoredAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      // Mode démo pour tester sans backend
      if (email.toLowerCase() === 'demo@pepete.fr' && password === 'demo123') {
        const demoUser = {
          _id: 'demo_user_001',
          name: 'Utilisateur Démo',
          email: 'demo@pepete.fr',
          role: 'user',
          phone: '06 00 00 00 00',
          createdAt: new Date().toISOString(),
        };
        await saveAuth('demo_token_pepete', demoUser);
        return { success: true, user: demoUser };
      }

      const response = await loginAPI(email, password);
      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return { success: false, error: 'Réponse serveur invalide' };
      }

      await saveAuth(newToken, userData);
      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.userMessage ||
        'Erreur de connexion. Vérifie tes identifiants.';
      return { success: false, error: message };
    }
  }, [saveAuth]);

  const register = useCallback(async (data = {}) => {
    try {
      const { name, email, password, phone, role, address, guardianProfile } = data;
      const response = await registerAPI(name, email, password, phone, role, address, guardianProfile);
      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return { success: false, error: 'Réponse serveur invalide' };
      }

      await saveAuth(newToken, userData, role);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Register failed:', error.response?.data || error.message);

      let message = "Erreur d'inscription";
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors.map(e => e.msg).join(', ');
      } else if (error.userMessage) {
        message = error.userMessage;
      }

      return { success: false, error: message };
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    await clearStoredAuth();
  }, [clearStoredAuth]);

  const updateUser = useCallback(async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
