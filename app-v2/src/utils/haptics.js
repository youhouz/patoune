// Cross-platform haptic feedback helper
// Safely no-ops on web and on errors
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const hapticLight = () => {
  if (!isNative) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
};

export const hapticMedium = () => {
  if (!isNative) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
};

export const hapticHeavy = () => {
  if (!isNative) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
};

export const hapticSuccess = () => {
  if (!isNative) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
};

export const hapticWarning = () => {
  if (!isNative) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (_) {}
};

export const hapticError = () => {
  if (!isNative) return;
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (_) {}
};

export const hapticSelection = () => {
  if (!isNative) return;
  try { Haptics.selectionAsync(); } catch (_) {}
};

export default {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
  selection: hapticSelection,
};
