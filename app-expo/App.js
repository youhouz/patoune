// ---------------------------------------------------------------------------
// Patoune v2.0 - Root App Entry
// Loads custom fonts (DM Sans + Playfair Display), holds the splash screen
// visible until everything is ready, then renders the app.
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '@expo-google-fonts/dm-sans';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/colors';
import 'react-native-gesture-handler';

// ---------------------------------------------------------------------------
// PWA: Register service worker on web
// ---------------------------------------------------------------------------
if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW failed:', err));
  });
}


// ---------------------------------------------------------------------------
// Keep the splash screen visible while we load fonts
// ---------------------------------------------------------------------------
SplashScreen.preventAutoHideAsync();


export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Load all required font weights
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_700Bold,
  });

  // Once fonts are loaded (or errored), mark the app as ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Hide the splash screen once the root view has performed layout
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Still loading - render nothing (splash screen stays visible)
  if (!appIsReady) {
    return null;
  }

  // Font loading failed - show a minimal error state
  if (fontError) {
    return (
      <View style={styles.errorContainer} onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.errorText}>
          Chargement des polices impossible.
        </Text>
      </View>
    );
  }

  // App is ready - render the full application
  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </View>
  );
}


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
