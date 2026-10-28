import {Alert, AppState, NativeModules, Platform} from 'react-native';
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

let permissionFlow: Promise<boolean> | null = null;

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitUntilActive(): Promise<void> {
  if (AppState.currentState === 'active') {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        sub.remove();
        resolve();
      }
    });
  });
}

/**
 * Full-screen and battery intents resolve as soon as Settings opens.
 * The next dialog has to wait until this activity is in front again,
 * otherwise Android drops it and the startup promise never finishes.
 */
async function waitUntilBackFromSettings(): Promise<void> {
  if (AppState.currentState !== 'active') {
    await waitUntilActive();
    await wait(300);
    return;
  }

  const leftApp = await new Promise<boolean>(resolve => {
    let subscription: {remove: () => void} | null = null;
    const timer = setTimeout(() => {
      subscription?.remove();
      resolve(false);
    }, 1000);
    subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        clearTimeout(timer);
        subscription?.remove();
        resolve(true);
      }
    });
  });

  if (leftApp) {
    await waitUntilActive();
  }
  await wait(300);
}

async function requestAndroidNotificationPermission(): Promise<boolean> {
  const {status: existingStatus} = await checkNotifications();
  if (existingStatus === RESULTS.GRANTED) {
    return true;
  }
  if (existingStatus === RESULTS.BLOCKED) {
    return false;
  }

  await waitUntilActive();
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
    return Platform.Version < 34;
  }
}

function promptOnce(
  storageKey: string,
  title: string,
  message: string,
  onAllow: () => void | Promise<void>,
): Promise<void> {
  return new Promise(resolve => {
    const run = async () => {
      try {
        const already = await AsyncStorage.getItem(storageKey);
        if (already === '1') {
          resolve();
          return;
        }
      } catch {
        // Continue prompting if storage read fails.
      }

      await waitUntilActive();

      Alert.alert(
        title,
        message,
        [
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
              await waitUntilBackFromSettings();
              resolve();
            },
          },
        ],
        {cancelable: false},
      );
    };

    run().catch(() => resolve());
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
 * One sequential permission pass for incoming calls.
 * Notification, full-screen intent, and battery are requested one after
 * another once the activity is visible, so a later app open does not ask again.
 */
export function ensureIncomingCallPermissions(): Promise<boolean> {
  if (permissionFlow) {
    return permissionFlow;
  }

  permissionFlow = (async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }

    await waitUntilActive();
    await wait(400);

    let notificationsOk = false;
    try {
      notificationsOk = await requestAndroidNotificationPermission();
    } catch {
      notificationsOk = false;
    }

    await waitUntilActive();
    await wait(300);
    try {
      await ensureFullScreenIntentPermission();
    } catch {
      // Full-screen prompt must not be skipped if an earlier dialog failed.
    }

    await waitUntilActive();
    await wait(300);
    try {
      await ensureBatteryOptimizationExempt();
    } catch {
      // Battery prompt is optional for the incoming-call screen.
    }

    return notificationsOk;
  })().catch(() => {
    permissionFlow = null;
    return false;
  });

  return permissionFlow;
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
