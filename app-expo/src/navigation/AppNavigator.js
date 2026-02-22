import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
const colors = require('../utils/colors');

const SplashLoader = () => (
  <LinearGradient
    colors={['#FF6B35', '#FF8F65']}
    style={styles.splash}
  >
    <StatusBar barStyle="light-content" />
    <Text style={styles.splashPaw}>🐾</Text>
    <Text style={styles.splashLogo}>patoune</Text>
    <View style={styles.loaderDots}>
      <View style={[styles.dot, { opacity: 0.4 }]} />
      <View style={[styles.dot, { opacity: 0.7 }]} />
      <View style={[styles.dot, { opacity: 1 }]} />
    </View>
  </LinearGradient>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashLoader />;
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashPaw: {
    fontSize: 64,
    marginBottom: 12,
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  loaderDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
});

export default AppNavigator;
