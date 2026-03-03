// ---------------------------------------------------------------------------
// Patoune v2.0 - useLocation Hook
// Custom hook for geolocation using expo-location.
// Returns current location, reverse-geocoded city name, and request handler.
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';


/**
 * Custom hook for geolocation.
 *
 * @returns {{
 *   location: { latitude: number, longitude: number } | null,
 *   city: string | null,
 *   loading: boolean,
 *   error: string | null,
 *   requestLocation: () => Promise<void>,
 * }}
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Requests location permission, gets the current position,
   * then reverse-geocodes it to extract the city name.
   * Results are cached in state until the next call.
   */
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusee');
        setLoading(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get city name
      try {
        const [geocoded] = await Location.reverseGeocodeAsync(coords);
        if (geocoded) {
          setCity(geocoded.city || geocoded.subregion || geocoded.region || null);
        }
      } catch (geoErr) {
        // Geocoding failure is non-critical, location is still usable
        console.log('Reverse geocode error:', geoErr.message);
      }
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
