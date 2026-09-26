import {InteractionManager} from 'react-native';
import {CommonActions, createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

type VideoCallParams = {
  channelName: string;
  token: string;
  appId: string;
  uid: number;
  appointmentId?: number;
  callKey?: string;
  uiAction?: string;
  status?: string;
  bothPresent?: boolean;
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

function isRootOnSplash(): boolean {
  try {
    if (!navigationRef.isReady()) {
      return false;
    }
    const state = navigationRef.getRootState();
    const routes = state?.routes;
    if (!routes?.length) {
      return false;
    }
    return routes.length === 1 && routes[0]?.name === 'SplashScreen';
  } catch {
    return false;
  }
}

/**
 * Cold-start accept must NOT mount VideoCallScreen as the only first route
 * with empty Agora params. Boot home, let the tree settle, then push call.
 */
export async function bootToVendorHomeAndSettle(): Promise<void> {
  if (!navigationRef.isReady()) {
    return;
  }

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

  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  await new Promise<void>(resolve =>
    InteractionManager.runAfterInteractions(() => resolve()),
  );
  await new Promise<void>(resolve => setTimeout(resolve, 350));
}

/**
 * Always target Authentication → VideoCallScreen (registered in AppRouter).
 *
 * Do NOT nest under VendorDrawer → VideoCallScreen: the drawer only mounts
 * `VendorHomeScreen` (a stack). Nested `screen: 'VideoCallScreen'` under the
 * drawer is a silent no-op — that broke accept / Join / Rejoin redirects.
 */
export async function navigateToVideoCall(
  params: VideoCallParams,
  options?: {afterIncomingPush?: boolean; settleHomeFirst?: boolean},
): Promise<void> {
  if (!navigationRef.isReady()) {
    pendingVideoCallParams = params;
    return;
  }

  const callParams = {
    role: 'vendor' as const,
    ...params,
  };

  const needsColdStartSettle =
    options?.settleHomeFirst ||
    options?.afterIncomingPush ||
    isRootOnSplash();

  if (needsColdStartSettle) {
    // Single reset: home underneath + call on top (reliable after kill/lock accept).
    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: 'Authentication',
          state: {
            index: 1,
            routes: [
              {name: 'VendorDrawer'},
              {name: 'VideoCallScreen', params: callParams},
            ],
          },
        },
      ],
    });
    return;
  }

  // In-app Join / Rejoin from Home / Bookings.
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Authentication',
      params: {
        screen: 'VideoCallScreen',
        params: callParams,
      },
    }),
  );
}

export function flushPendingVideoCallNavigation() {
  if (!pendingVideoCallParams || !navigationRef.isReady()) {
    return;
  }

  const params = pendingVideoCallParams;
  pendingVideoCallParams = null;
  void navigateToVideoCall(params, {settleHomeFirst: true});
}

export function isOnVideoCallScreen(): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  const currentRoute = navigationRef.getCurrentRoute();
  if (currentRoute?.name === 'VideoCallScreen') {
    return true;
  }

  try {
    const state = navigationRef.getRootState();
    const authRoute = state.routes.find(route => route.name === 'Authentication');
    const authState = authRoute?.state;
    if (!authState?.routes?.length) {
      return false;
    }

    const activeAuthRoute = authState.routes[authState.index ?? 0];
    if (activeAuthRoute?.name === 'VideoCallScreen') {
      return true;
    }

    // VendorDrawer → VendorHomeScreen (stack) → VideoCallScreen
    const drawerState = activeAuthRoute?.state;
    if (drawerState?.routes?.length) {
      const activeDrawer = drawerState.routes[drawerState.index ?? 0];
      if (activeDrawer?.name === 'VideoCallScreen') {
        return true;
      }
      const stackState = activeDrawer?.state;
      if (stackState?.routes?.length) {
        const activeStack = stackState.routes[stackState.index ?? 0];
        return activeStack?.name === 'VideoCallScreen';
      }
    }
  } catch {
    return false;
  }

  return false;
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

/** Soft-miss / late-join path → appointments list or a specific detail. */
export function navigateToHealthAppointments(appointmentId?: number | null) {
  if (!navigationRef.isReady()) {
    return;
  }

  if (appointmentId) {
    navigationRef.navigate('Authentication', {
      screen: 'HealthAppointmentDetailScreen',
      params: {appointmentId: Number(appointmentId)},
    });
    return;
  }

  navigationRef.navigate('Authentication', {
    screen: 'HealthAppointmentsScreen',
  });
}
