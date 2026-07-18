import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

type VideoCallParams = {
  channelName: string;
  token: string;
  appId: string;
  uid: number;
  appointmentId?: number;
  callKey?: string;
};

let pendingVideoCallParams: VideoCallParams | null = null;

export async function waitForNavigationReady(
  timeoutMs = 15000,
): Promise<boolean> {
  const start = Date.now();
  while (!navigationRef.isReady()) {
    if (Date.now() - start > timeoutMs) {
      return false;
    }
    await new Promise<void>(resolve => {
      setTimeout(resolve, 50);
    });
  }
  return true;
}

export function navigateToVideoCall(params: VideoCallParams) {
  if (!navigationRef.isReady()) {
    pendingVideoCallParams = params;
    return;
  }

  // Direct route avoids loading Drawer/Reanimated during cold-start call accept.
  navigationRef.navigate('Authentication', {
    screen: 'VideoCallScreen',
    params: {
      role: 'vendor',
      ...params,
    },
  });
}

export function flushPendingVideoCallNavigation() {
  if (!pendingVideoCallParams || !navigationRef.isReady()) {
    return;
  }

  const params = pendingVideoCallParams;
  pendingVideoCallParams = null;
  navigateToVideoCall(params);
}

export function isOnVideoCallScreen(): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  const currentRoute = navigationRef.getCurrentRoute();
  if (currentRoute?.name === 'VideoCallScreen') {
    return true;
  }

  const state = navigationRef.getRootState();
  const authRoute = state.routes.find(route => route.name === 'Authentication');
  const authState = authRoute?.state;
  if (!authState?.routes?.length) {
    return false;
  }

  const activeAuthRoute = authState.routes[authState.index ?? 0];
  return activeAuthRoute?.name === 'VideoCallScreen';
}

/** After a call ends — cold-start accept leaves no screen to go back to. */
export function navigateToHomeAfterCall() {
  if (!navigationRef.isReady()) {
    return;
  }

  pendingVideoCallParams = null;

  navigationRef.reset({
    index: 0,
    routes: [
      {
        name: 'Authentication',
        state: {
          index: 0,
          routes: [{name: 'VendorDrawer'}],
        },
      },
    ],
  });
}

export function leaveVideoCallScreen() {
  if (!navigationRef.isReady()) {
    return;
  }

  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
    return;
  }

  navigateToHomeAfterCall();
}
