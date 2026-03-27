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
// Inject CSS that forces all direct flex children in the app tree to allow shrinking.
// Uses [style*="flex"] to only target flex containers, not all divs.
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
    /* Force all flex ancestors to allow shrinking (CSS default is min-height:auto) */
    #root > div,
    #root > div > div,
    #root > div > div > div,
    #root > div > div > div > div,
    #root > div > div > div > div > div,
    #root > div > div > div > div > div > div,
    #root > div > div > div > div > div > div > div {
      min-height: 0 !important;
    }
    /* RN Web ScrollView: make the outer wrapper scrollable */
    [data-testid] > [style*="overflow"] {
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
