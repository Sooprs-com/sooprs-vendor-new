import {AppState, InteractionManager, Platform} from 'react-native';

const ANDROID_POST_INCOMING_CALL_DELAY_MS = 450;

/**
 * After accepting from the full-screen incoming-call Activity, wait for that
 * Activity to tear down and for the JS/native stack to settle before pushing
 * the Agora call screen. Navigating too early causes intermittent crashes
 * (Reanimated / Fabric view-op races) especially on kill + lock-screen accept.
 */
export async function waitUntilAppIsActive(timeoutMs = 8000): Promise<void> {
  if (AppState.currentState === 'active') {
    return;
  }

  await new Promise<void>(resolve => {
    const timer = setTimeout(() => {
      subscription.remove();
      resolve();
    }, timeoutMs);

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        clearTimeout(timer);
        subscription.remove();
        resolve();
      }
    });
  });
}

export async function waitForIncomingCallTransition(): Promise<void> {
  await waitUntilAppIsActive();
  await new Promise<void>(resolve => {
    InteractionManager.runAfterInteractions(() => resolve());
  });

  if (Platform.OS === 'android') {
    await new Promise<void>(resolve =>
      setTimeout(resolve, ANDROID_POST_INCOMING_CALL_DELAY_MS),
    );
  }
}
