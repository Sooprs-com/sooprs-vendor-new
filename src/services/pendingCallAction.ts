import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, NativeModules} from 'react-native';
import {IncomingCallData} from '../types/vendorCall';

const STORAGE_KEY = '@vendor_pending_call_action_v1';

export type PendingCallAction = {
  action: 'accept' | 'join' | 'reject';
  savedAt: number;
  data: IncomingCallData;
};

const {IncomingCallAlert} = NativeModules;

function normalizePending(raw: string): PendingCallAction | null {
  try {
    const parsed = JSON.parse(raw) as PendingCallAction & {
      createdAt?: number;
      data?: IncomingCallData & {appointmentId?: number | string};
    };
    if (!parsed?.action || !parsed?.data) {
      return null;
    }
    const appointmentId = Number(parsed.data.appointmentId);
    if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
      return null;
    }
    return {
      action: parsed.action,
      savedAt: Number(parsed.savedAt || parsed.createdAt || Date.now()),
      data: {
        ...parsed.data,
        appointmentId,
      },
    };
  } catch {
    return null;
  }
}

export async function savePendingCallAction(
  action: PendingCallAction,
): Promise<void> {
  const serialized = JSON.stringify(action);

  // Native SharedPreferences first — survives process death if AsyncStorage
  // has not flushed yet (killed-state Accept → finishAndRemoveTask).
  if (Platform.OS === 'android' && IncomingCallAlert?.savePendingAction) {
    try {
      await IncomingCallAlert.savePendingAction(serialized);
    } catch {
      // Native module optional until rebuild
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

export async function loadPendingCallAction(): Promise<PendingCallAction | null> {
  // Prefer native prefs on Android (written by NotificationReceiverHandler /
  // FullScreenIncomingCall before the call Activity tears down).
  if (Platform.OS === 'android' && IncomingCallAlert?.loadPendingAction) {
    try {
      const nativeRaw = await IncomingCallAlert.loadPendingAction();
      const fromNative = nativeRaw ? normalizePending(nativeRaw) : null;
      if (fromNative) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fromNative));
        return fromNative;
      }
    } catch {
      // fall through to AsyncStorage
    }
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return normalizePending(raw);
}

export async function clearPendingCallAction(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);

  if (Platform.OS === 'android' && IncomingCallAlert?.clearPendingAction) {
    try {
      await IncomingCallAlert.clearPendingAction();
    } catch {
      // ignore
    }
  }
}
