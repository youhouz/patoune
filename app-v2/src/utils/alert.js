import { Alert, Platform } from 'react-native';

export const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmBtn = buttons.find(b => b.style === 'destructive' || b.style !== 'cancel');
      const result = window.confirm(`${title}\n\n${message || ''}`);
      if (result && confirmBtn?.onPress) {
        confirmBtn.onPress();
      }
    } else {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
