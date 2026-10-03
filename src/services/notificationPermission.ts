import {Alert, NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canUseFullScreenIntent,
  checkNotifications,
  openSettings,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';

const PROMPTED_FSI_KEY = 'vendor_prompted_fullscreen_intent_v1';
const PROMPTED_BATTERY_KEY = 'vendor_prompted_battery_opt_v1';

type IncomingCallAlertNative = {
  isIgnoringBatteryOptimizations?: () => Promise<boolean>;
  requestIgnoreBatteryOptimizations?: () => Promise<boolean>;
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<boolean>;
};

const IncomingCallAlert =
  NativeModules.IncomingCallAlert as IncomingCallAlertNative | undefined;

async function requestAndroidNotificationPermission(): Promise<boolean> {
  const {status: existingStatus} = await checkNotifications();
  if (existingStatus === RESULTS.GRANTED) {
    return true;
  }
  if (existingStatus === RESULTS.BLOCKED) {
    return false;
  }

  const {status} = await requestNotifications(['alert', 'sound', 'badge'], {
    title: 'Enable Notifications',
    message:
      'Allow notifications so you can receive incoming consultation calls even when the app is closed.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return status === RESULTS.GRANTED;
}

async function checkFullScreenIntentAllowed(): Promise<boolean> {
  try {
    if (IncomingCallAlert?.canUseFullScreenIntent) {
      return await IncomingCallAlert.canUseFullScreenIntent();
    }
    return await canUseFullScreenIntent();
  } catch {
    // Pre-Android 14 or unsupported — treat as allowed.
    return true;
  }
}

function promptOnce(
  storageKey: string,
  title: string,
  message: string,
  onAllow: () => void | Promise<void>,
): Promise<void> {
  return new Promise(async resolve => {
    try {
      const already = await AsyncStorage.getItem(storageKey);
      if (already === '1') {
        resolve();
        return;
      }
    } catch {
      // Continue prompting if storage read fails.
    }

    Alert.alert(title, message, [
      {
        text: 'Not now',
        style: 'cancel',
        onPress: async () => {
          try {
            await AsyncStorage.setItem(storageKey, '1');
          } catch {
            // ignore
          }
          resolve();
        },
      },
      {
        text: 'Allow',
        onPress: async () => {
          try {
            await AsyncStorage.setItem(storageKey, '1');
          } catch {
            // ignore
          }
          try {
            await onAllow();
          } catch {
            // ignore
          }
          resolve();
        },
      },
    ]);
  });
}

async function ensureFullScreenIntentPermission(): Promise<void> {
  const allowed = await checkFullScreenIntentAllowed();
  if (allowed) {
    return;
  }

  await promptOnce(
    PROMPTED_FSI_KEY,
    'Allow full-screen calls',
    'To show incoming consultation calls over the lock screen (like WhatsApp), allow full-screen notifications for Sooprs Vendor.',
    async () => {
      if (IncomingCallAlert?.openFullScreenIntentSettings) {
        await IncomingCallAlert.openFullScreenIntentSettings();
        return;
      }
      await openSettings('fullscreen');
    },
  );
}

async function ensureBatteryOptimizationExempt(): Promise<void> {
  if (!IncomingCallAlert?.isIgnoringBatteryOptimizations) {
    return;
  }

  try {
    const ignoring = await IncomingCallAlert.isIgnoringBatteryOptimizations();
    if (ignoring) {
      return;
    }
  } catch {
    return;
  }

  await promptOnce(
    PROMPTED_BATTERY_KEY,
    'Keep calls reliable',
    'Disable battery optimization for Sooprs Vendor so incoming video calls can ring and show on the lock screen when the app is in the background.',
    async () => {
      await IncomingCallAlert?.requestIgnoreBatteryOptimizations?.();
    },
  );
}

/**
 * Requests everything needed for WhatsApp-like lock-screen incoming calls:
 * notifications, Android 14+ full-screen intent, and battery unrestricted.
 */
export async function ensureIncomingCallPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  const notificationsOk = await requestAndroidNotificationPermission();
  // Prompt critical call permissions after notification dialog settles.
  await ensureFullScreenIntentPermission();
  await ensureBatteryOptimizationExempt();
  return notificationsOk;
}

/** @deprecated Prefer ensureIncomingCallPermissions for call reliability. */
export async function requestNotificationPermission(): Promise<boolean> {
  return ensureIncomingCallPermissions();
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
