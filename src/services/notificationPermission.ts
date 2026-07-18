import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';

/**
 * Requests notification permission required for FCM push and incoming call alerts.
 * Android 13+ needs POST_NOTIFICATIONS at runtime; Firebase requestPermission is iOS-only.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const {status: existingStatus} = await checkNotifications();
    if (existingStatus === RESULTS.GRANTED) {
      return true;
    }
    if (existingStatus === RESULTS.BLOCKED) {
      return false;
    }

    const {status} = await requestNotifications(
      ['alert', 'sound', 'badge'],
      {
        title: 'Enable Notifications',
        message:
          'Allow notifications so you can receive incoming consultation calls and important updates.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return status === RESULTS.GRANTED;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const {status} = await checkNotifications();
    return status === RESULTS.GRANTED;
  }

  const authStatus = await messaging().hasPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}
