import React, { createContext, useState, useEffect, useContext } from 'react';
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

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }

    } catch (error) {
      console.log('Erreur verification auth:', error);
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
      const message = error.response?.data?.error || 'Erreur de connexion. Verifie que tu es sur le meme reseau Wi-Fi que le serveur.';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const response = await registerAPI(name, email, password, phone);
      const { token: newToken, user: userData } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erreur d'inscription";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
