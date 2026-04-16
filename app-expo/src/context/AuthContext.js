import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAPI, registerAPI, getMeAPI } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('owner'); // 'owner' | 'petsitter'

  useEffect(() => {
    checkAuth();
    AsyncStorage.getItem('activeMode').then(mode => {
      if (mode === 'owner' || mode === 'petsitter') setActiveMode(mode);
    });
  }, []);

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'userRole']);
    setToken(null);
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (!storedToken) {
        return;
      }

      setToken(storedToken);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Always refresh the profile to prevent stale or invalid sessions.
      const response = await getMeAPI();
      const me = response.data?.user;
      if (me) {
        setUser(me);
        await AsyncStorage.setItem('user', JSON.stringify(me));
        return;
      }

      await clearStoredAuth();

    } catch (error) {
      console.log('Erreur verification auth:', error);
      await clearStoredAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginAPI(email, password);
      const { token: newToken, user: userData } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', JSON.stringify(error.response?.data), 'status:', error.response?.status);
      const message = error.userMessage || error.response?.data?.error || 'Identifiants incorrects ou serveur injoignable.';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password, phone, role, address, guardianProfile) => {
    try {
      const response = await registerAPI(name, email, password, phone, role, address, guardianProfile);
      const { token: newToken, user: userData } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Also store role for quick access
      if (role) {
        await AsyncStorage.setItem('userRole', role);
      }

      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const respData = error.response?.data;
      console.error('Register failed:', JSON.stringify(respData), 'status:', error.response?.status);
      let message = "Erreur d'inscription";

      if (respData?.error) {
          message = respData.error;
      } else if (respData?.errors?.length > 0) {
          message = respData.errors
            .map(e => typeof e === 'string' ? e : e.msg)
            .filter(Boolean)
            .join(', ');
      } else if (error.userMessage) {
          message = error.userMessage;
      } else if (error.message && error.message !== 'Register failed') {
          message = error.message;
      }

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await clearStoredAuth();
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  // Re-fetch the current user from the API (used after returning from Stripe Checkout,
  // or any time the subscription/premium state may have changed server-side).
  const refreshUser = async () => {
    try {
      const res = await getMeAPI();
      const me = res.data?.user;
      if (me) {
        setUser(me);
        await AsyncStorage.setItem('user', JSON.stringify(me));
        return me;
      }
    } catch (err) {
      console.log('refreshUser error:', err.message);
    }
    return null;
  };

  const switchMode = async (mode) => {
    setActiveMode(mode);
    await AsyncStorage.setItem('activeMode', mode);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      activeMode,
      switchMode,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
