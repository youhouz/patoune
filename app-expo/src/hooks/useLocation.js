// ---------------------------------------------------------------------------
// Pépète v2.0 - useLocation Hook
// Custom hook for geolocation with web browser fallback.
// Returns current location, reverse-geocoded city name, and request handler.
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Reverse geocode using Nominatim (free, no API key needed).
 * Works on all platforms including web.
 */
const reverseGeocodeWeb = async (latitude, longitude) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'Pépète/2.0' } }
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || null;
  } catch {
    return null;
  }
};

/**
 * Get position using the browser Geolocation API directly.
 * More reliable than expo-location on web.
 */
const getWebPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation non supportee par ce navigateur'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Permission de localisation refusee. Active-la dans les reglages de ton navigateur.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Position indisponible. Verifie ta connexion ou ton GPS.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Delai depasse pour la localisation. Reessaye.'));
            break;
          default:
            reject(new Error('Impossible de recuperer la localisation'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000, // Cache 5 min
      }
    );
  });
};

/**
 * Custom hook for geolocation.
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let coords;

      if (Platform.OS === 'web') {
        // Use browser Geolocation API directly — more reliable on web
        coords = await getWebPosition();
      } else {
        // Native: use expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission de localisation refusee');
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      setLocation(coords);

      // Reverse geocode to get city name
      let cityName = null;

      if (Platform.OS === 'web') {
        // Use Nominatim on web (free, no API key)
        cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
      } else {
        try {
          const [geocoded] = await Location.reverseGeocodeAsync(coords);
          if (geocoded) {
            cityName = geocoded.city || geocoded.subregion || geocoded.region || null;
          }
        } catch (geoErr) {
          // Fallback to Nominatim if native geocoding fails
          console.log('Reverse geocode error:', geoErr.message);
          cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
        }
      }

      setCity(cityName);
    } catch (err) {
      setError(err.message || 'Impossible de recuperer la localisation');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    city,
    loading,
    error,
    requestLocation,
  };
};

export default useLocation;
