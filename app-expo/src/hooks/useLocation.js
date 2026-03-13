// ---------------------------------------------------------------------------
// Pépète v3.0 - useLocation Hook
// Géolocalisation avec fallback IP automatique quand GPS refusé.
// APIs gratuites : BigDataCloud (reverse geo) + ip-api.com (fallback IP)
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Reverse geocode via BigDataCloud (gratuit, rapide, pas de clé API).
 * Plus fiable que Nominatim pour les usages courants.
 */
const reverseGeocodeWeb = async (latitude, longitude) => {
  // Essai 1 : BigDataCloud (gratuit, pas de clé, très rapide)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || null;
      if (city) return city;
    }
  } catch (_) {}

  // Essai 2 : Nominatim (fallback)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
      {
        headers: { 'User-Agent': 'Pepete/3.0' },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || null;
    }
  } catch (_) {}

  return null;
};

/**
 * Fallback IP-based geolocation when GPS is unavailable/denied.
 * Uses ip-api.com (gratuit, 45 req/min, pas de clé).
 */
const getLocationFromIP = async () => {
  try {
    const res = await fetch('https://ip-api.com/json/?lang=fr&fields=status,city,lat,lon,countryCode', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.lat && data.lon) {
        return {
          coords: { latitude: data.lat, longitude: data.lon },
          city: data.city || null,
          approximate: true,
        };
      }
    }
  } catch (_) {}

  // Fallback ultime : Paris par défaut (centre France)
  return {
    coords: { latitude: 48.8566, longitude: 2.3522 },
    city: 'Paris',
    approximate: true,
  };
};

/**
 * Get GPS position via browser Geolocation API.
 */
const getWebPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation non supportée'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (err.code === 1 /* PERMISSION_DENIED */) {
          reject(new Error('PERMISSION_DENIED'));
        } else {
          reject(new Error(err.message || 'Position indisponible'));
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });

/**
 * Custom hook for geolocation.
 * Stratégie : GPS (précis) → fallback IP (approximatif) si refus/erreur
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approximate, setApproximate] = useState(false);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let coords = null;
      let cityName = null;
      let isApproximate = false;

      if (Platform.OS === 'web') {
        // Essai GPS navigateur
        try {
          coords = await getWebPosition();
          cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
        } catch (gpsErr) {
          // GPS refusé ou indisponible → fallback IP
          console.log('GPS indisponible, fallback IP:', gpsErr.message);
          const ipResult = await getLocationFromIP();
          coords = ipResult.coords;
          cityName = ipResult.city;
          isApproximate = ipResult.approximate;
        }
      } else {
        // Native: expo-location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            // Fallback IP sur natif aussi
            const ipResult = await getLocationFromIP();
            coords = ipResult.coords;
            cityName = ipResult.city;
            isApproximate = ipResult.approximate;
          } else {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };

            // Reverse geocode natif
            try {
              const [geocoded] = await Location.reverseGeocodeAsync(coords);
              cityName = geocoded?.city || geocoded?.subregion || geocoded?.region || null;
            } catch (_) {
              cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
            }
          }
        } catch (nativeErr) {
          const ipResult = await getLocationFromIP();
          coords = ipResult.coords;
          cityName = ipResult.city;
          isApproximate = ipResult.approximate;
        }
      }

      setLocation(coords);
      setCity(cityName);
      setApproximate(isApproximate);
    } catch (err) {
      // Dernier recours : fallback IP
      try {
        const ipResult = await getLocationFromIP();
        setLocation(ipResult.coords);
        setCity(ipResult.city);
        setApproximate(true);
      } catch (_) {
        setError('Impossible de récupérer la localisation');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    city,
    loading,
    error,
    approximate,
    requestLocation,
  };
};

export default useLocation;
