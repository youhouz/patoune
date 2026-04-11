import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/** Create an AbortSignal with timeout, compatible with all RN/web environments */
const createTimeoutSignal = (ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  // Clean up timer if request completes before timeout
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timer);
    originalAbort();
  };
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal });
    clear();
    return res;
  } catch (err) {
    clear();
    throw err;
  }
};

const reverseGeocodeWeb = async (latitude, longitude) => {
  try {
    const res = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
      {},
      5000
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || null;
      if (city) return city;
    }
  } catch (_) {}

  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'Pepete/3.0' } },
      6000
    );
    if (res.ok) {
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || null;
    }
  } catch (_) {}

  return null;
};

const getLocationFromIP = async () => {
  try {
    const res = await fetchWithTimeout(
      'https://ip-api.com/json/?lang=fr&fields=status,city,lat,lon,countryCode',
      {},
      5000
    );
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

  // Fallback: return null to signal that IP geolocation failed entirely
  return null;
};

export const geocodeCity = async (cityQuery) => {
  if (!cityQuery || !cityQuery.trim()) return null;

  const q = encodeURIComponent(cityQuery.trim() + ', France');

  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr&accept-language=fr`,
      { headers: { 'User-Agent': 'Pepete/3.0' } },
      7000
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const short = display_name.split(',')[0].trim();
        return { latitude: parseFloat(lat), longitude: parseFloat(lon), displayName: short };
      }
    }
  } catch (_) {}

  try {
    const res2 = await fetchWithTimeout(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(cityQuery.trim())}&limit=1&lang=fr`,
      {},
      6000
    );
    if (res2.ok) {
      const data2 = await res2.json();
      const feat = data2.features?.[0];
      if (feat) {
        const [lon, lat] = feat.geometry.coordinates;
        const name = feat.properties.city || feat.properties.name || cityQuery;
        return { latitude: lat, longitude: lon, displayName: name };
      }
    }
  } catch (_) {}

  return null;
};

const getWebPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation non supportée'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) {
          reject(new Error('PERMISSION_DENIED'));
        } else {
          reject(new Error(err.message || 'Position indisponible'));
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });

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
        try {
          coords = await getWebPosition();
          cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
        } catch (gpsErr) {
          console.log('GPS indisponible, fallback IP:', gpsErr.message);
          const ipResult = await getLocationFromIP();
          if (ipResult) {
            coords = ipResult.coords;
            cityName = ipResult.city;
            isApproximate = ipResult.approximate;
          }
        }
      } else {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            const ipResult = await getLocationFromIP();
            if (ipResult) {
              coords = ipResult.coords;
              cityName = ipResult.city;
              isApproximate = ipResult.approximate;
            }
          } else {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };

            try {
              const geocodeResult = await Location.reverseGeocodeAsync(coords);
              const geocoded = geocodeResult?.[0];
              cityName = geocoded?.city || geocoded?.subregion || geocoded?.region || null;
            } catch (_) {
              cityName = await reverseGeocodeWeb(coords.latitude, coords.longitude);
            }
          }
        } catch (nativeErr) {
          const ipResult = await getLocationFromIP();
          if (ipResult) {
            coords = ipResult.coords;
            cityName = ipResult.city;
            isApproximate = ipResult.approximate;
          }
        }
      }

      if (coords) {
        setLocation(coords);
        setCity(cityName);
        setApproximate(isApproximate);
      } else {
        setError('Impossible de récupérer la localisation. Saisissez une ville manuellement.');
      }
    } catch (err) {
      try {
        const ipResult = await getLocationFromIP();
        if (ipResult) {
          setLocation(ipResult.coords);
          setCity(ipResult.city);
          setApproximate(true);
        } else {
          setError('Impossible de récupérer la localisation. Saisissez une ville manuellement.');
        }
      } catch (_) {
        setError('Impossible de récupérer la localisation. Saisissez une ville manuellement.');
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
