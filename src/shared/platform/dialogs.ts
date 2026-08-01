import { Alert, Platform } from 'react-native';

export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function confirmDiscardChanges(title: string, onDiscard: () => void): void {
  const message = 'Your changes will not be saved.';
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onDiscard();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);
}
