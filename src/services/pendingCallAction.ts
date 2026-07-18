import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, NativeModules} from 'react-native';
import {IncomingCallData} from '../types/vendorCall';

const STORAGE_KEY = '@vendor_pending_call_action_v1';

export type PendingCallAction = {
  action: 'accept' | 'reject';
  savedAt: number;
  data: IncomingCallData;
};

const {IncomingCallAlert} = NativeModules;

export async function savePendingCallAction(
  action: PendingCallAction,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(action));

  if (Platform.OS === 'android' && IncomingCallAlert?.savePendingAction) {
    try {
      await IncomingCallAlert.savePendingAction(JSON.stringify(action));
    } catch {
      // Native module optional until rebuild
    }
  }
}

export async function loadPendingCallAction(): Promise<PendingCallAction | null> {
  let raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw && Platform.OS === 'android' && IncomingCallAlert?.loadPendingAction) {
    try {
      raw = await IncomingCallAlert.loadPendingAction();
      if (raw) {
        await AsyncStorage.setItem(STORAGE_KEY, raw);
      }
    } catch {
      // ignore
    }
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingCallAction;
    if (!parsed?.action || !parsed?.data?.appointmentId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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
