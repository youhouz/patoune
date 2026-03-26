import { Platform } from 'react-native';
import api from '../api/client';

/**
 * Request push notification permission and subscribe the user.
 * Only works on web (PWA) with service worker support.
 */
export async function subscribeToPush() {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    // Get VAPID key from backend
    const { data } = await api.get('/notifications/vapid-key');
    if (!data?.key) return false;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.key),
    });

    // Send subscription to backend
    await api.post('/notifications/subscribe', {
      subscription: subscription.toJSON(),
    });

    return true;
  } catch (err) {
    console.warn('[Push] Subscribe error:', err.message);
    return false;
  }
}

export async function unsubscribeFromPush() {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await api.post('/notifications/unsubscribe', {
        endpoint: subscription.endpoint,
      });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.warn('[Push] Unsubscribe error:', err.message);
  }
}

export async function isPushSubscribed() {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (_) {
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
