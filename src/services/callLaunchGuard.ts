import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vendor_call_launch_guard_v1';
const TTL_MS = 5 * 60 * 1000;

type GuardState = {
  active: boolean;
  appointmentId?: number;
  savedAt: number;
};

export async function markCallLaunchGuard(appointmentId?: number): Promise<void> {
  const state: GuardState = {
    active: true,
    appointmentId,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearCallLaunchGuard(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function isCallLaunchGuardActive(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const state = JSON.parse(raw) as GuardState;
    if (!state?.active) {
      return false;
    }
    if (Date.now() - state.savedAt > TTL_MS) {
      await clearCallLaunchGuard();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
