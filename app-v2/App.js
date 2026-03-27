import React, { useEffect, useState } from 'react';
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

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/colors';
import 'react-native-gesture-handler';

if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW failed:', err));
  });
}

// Fix iOS Safari PWA scrolling globally:
// In standalone PWA mode, CSS flexbox defaults min-height to "auto" which prevents
// flex children from shrinking below their content size. This breaks ScrollView/FlatList
// because they never get a constrained height and expand to full content instead of scrolling.
// Since #root is position:fixed with explicit bounds, all descendants can safely use min-height:0.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'pwa-scroll-fix';
  style.textContent = `
    html, body {
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
      overscroll-behavior: none;
    }
    #root {
      position: fixed !important;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex !important;
      overflow: hidden;
    }
    /* Allow ALL flex children inside #root to shrink — fixes scroll on every screen */
    #root div {
      min-height: 0 !important;
    }
    /* Ensure RN Web ScrollView inner container scrolls properly on iOS Safari */
    [style*="overflow: auto"], [style*="overflow:auto"],
    [style*="overflow: scroll"], [style*="overflow:scroll"],
    [style*="overflowY: auto"], [style*="overflowY:auto"],
    [style*="overflowY: scroll"], [style*="overflowY:scroll"] {
      -webkit-overflow-scrolling: touch !important;
    }
  `;
  document.head.appendChild(style);
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!appIsReady) {
    return null;
  }

  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.errorText}>
          Chargement des polices impossible.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

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
