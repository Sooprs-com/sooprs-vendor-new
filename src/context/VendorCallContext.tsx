import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {AppState, NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
// Socket disabled — incoming calls now arrive via FCM push only.
// import {
//   connectVendorHealthSocket,
//   disconnectVendorHealthSocket,
// } from '../services/vendorHealthSocket';
import {healthVideoApi} from '../services/healthVideoApi';
import {mobile_siteConfig} from '../services/mobile-siteConfig';
import {
  startIncomingRingtone,
  stopIncomingRingtone,
} from '../services/incomingRingtone';
import {
  AgoraCallData,
  CallNotification,
  IncomingCallData,
} from '../types/vendorCall';
import {
  flushPendingVideoCallNavigation,
  navigateToVideoCall,
  waitForNavigationReady,
} from '../router/navigationRef';
import {
  isIncomingCallPush,
  parseIncomingCallPush,
} from '../services/incomingCallTypes';
import {
  acceptIncomingCallFromPush,
  rejectIncomingCallFromPush,
} from '../services/incomingCallActions';
import {
  clearPendingCallAction,
  loadPendingCallAction,
} from '../services/pendingCallAction';
import {
  clearCallLaunchGuard,
  markCallLaunchGuard,
} from '../services/callLaunchGuard';
import {
  hideIncomingCallNotification,
  RNNotificationCall,
  showBackgroundIncomingCall,
} from '../services/callKeepService';
import Toast from 'react-native-toast-message';
import {requestNotificationPermission} from '../services/notificationPermission';

type VendorCallContextValue = {
  socketConnected: boolean;
  incomingCall: IncomingCallData | null;
  activeCall: AgoraCallData | null;
  notifications: CallNotification[];
  acceptCall: () => Promise<AgoraCallData | null>;
  rejectCall: (reason?: string) => Promise<void>;
  endCall: () => Promise<void>;
  startCall: (appointmentId: number) => Promise<AgoraCallData | null>;
  clearIncoming: () => void;
};

const VendorCallContext = createContext<VendorCallContextValue | null>(null);

function getCallSessionKey(callData: {
  appointmentId: number;
  callSessionId?: string;
  pushUuid?: string;
}): string {
  return String(
    callData.pushUuid ||
      callData.callSessionId ||
      `vendor-call-${callData.appointmentId}`,
  );
}

function isLoggedInValue(value: string | null) {
  return value === 'TRUE' || value === 'true' || value === '1';
}

function sanitizeToken(value: string | null) {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, '').trim();
}

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

async function loadVendorTokenFromStorage(): Promise<string | null> {
  const isLogin = await AsyncStorage.getItem(mobile_siteConfig.IS_LOGIN);
  const rawToken = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
  );
  const token = sanitizeToken(rawToken);
  return isLoggedInValue(isLogin) && token ? token : null;
}

export function VendorCallProvider({children}: {children: React.ReactNode}) {
  const [vendorToken, setVendorToken] = useState<string | null>(null);
  // Socket disabled — stays false/empty until the socket flow is re-enabled.
  const socketConnected = false;
  const notifications: CallNotification[] = [];
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<AgoraCallData | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const fcmTokenRef = useRef<string | null>(null);
  const recentlyHandledSessionsRef = useRef<Map<string, number>>(new Map());
  const processingPendingCallRef = useRef(false);
  const navigatedCallAppointmentRef = useRef<number | null>(null);
  const activeCallRef = useRef<AgoraCallData | null>(null);

  const markRecentlyHandled = useCallback((callData: IncomingCallData) => {
    recentlyHandledSessionsRef.current.set(
      getCallSessionKey(callData),
      Date.now(),
    );
  }, []);

  const clearCallSessionState = useCallback((appointmentId: number) => {
    for (const key of recentlyHandledSessionsRef.current.keys()) {
      if (
        key === String(appointmentId) ||
        key === `vendor-call-${appointmentId}` ||
        key.endsWith(`-${appointmentId}`)
      ) {
        recentlyHandledSessionsRef.current.delete(key);
      }
    }

    navigatedCallAppointmentRef.current = null;

    if (Platform.OS === 'android') {
      try {
        NativeModules.IncomingCallAlert?.clearNativeHandled?.();
      } catch {
        // Native module optional until rebuild
      }
    }
  }, []);

  const clearIncomingCallUi = useCallback((options?: {skipHideNotification?: boolean}) => {
    setIncomingCall(null);
    stopIncomingRingtone();
    if (!options?.skipHideNotification) {
      hideIncomingCallNotification();
    }
    // Killed-state pushes start a native foreground ringtone service — stop it too.
    if (Platform.OS === 'android') {
      try {
        NativeModules.IncomingCallAlert?.stopRingtoneService?.();
      } catch {
        // Native module optional until rebuild
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncToken = async () => {
      const isLogin = await AsyncStorage.getItem(mobile_siteConfig.IS_LOGIN);
      const rawToken = await AsyncStorage.getItem(
        mobile_siteConfig.MOB_ACCESS_TOKEN_KEY,
      );
      const token = sanitizeToken(rawToken);
      const nextToken = isLoggedInValue(isLogin) && token ? token : null;
      if (mounted) {
        setVendorToken(prev => (prev === nextToken ? prev : nextToken));
      }
    };

    syncToken();
    const interval = setInterval(syncToken, 3000);

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncToken();
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const navigateToActiveCall = useCallback((callData: AgoraCallData) => {
    const sessionKey = getCallSessionKey(callData);
    navigatedCallAppointmentRef.current = callData.appointmentId;
    navigateToVideoCall({
      channelName: callData.channelName,
      token: callData.token,
      appId: callData.appId,
      uid: callData.uid,
      appointmentId: callData.appointmentId,
      callKey: sessionKey,
    });
    flushPendingVideoCallNavigation();
  }, []);

  const acceptCall = useCallback(async () => {
    if (!vendorToken || !incomingCall?.appointmentId) {
      return null;
    }

    markRecentlyHandled(incomingCall);
    const callData = await acceptIncomingCallFromPush(
      vendorToken,
      incomingCall,
    );
    setActiveCall(callData);
    clearIncomingCallUi();
    await clearPendingCallAction();
    await clearCallLaunchGuard();
    navigateToActiveCall(callData);
    return callData;
  }, [
    vendorToken,
    incomingCall,
    markRecentlyHandled,
    clearIncomingCallUi,
    navigateToActiveCall,
  ]);

  const rejectCall = useCallback(
    async (reason = 'declined_by_vendor') => {
      if (!vendorToken || !incomingCall?.appointmentId) {
        return;
      }

      markRecentlyHandled(incomingCall);
      await rejectIncomingCallFromPush(vendorToken, incomingCall, reason);
      clearIncomingCallUi();
      await clearPendingCallAction();
      await clearCallLaunchGuard();
    },
    [vendorToken, incomingCall, markRecentlyHandled, clearIncomingCallUi],
  );

  const endCall = useCallback(async () => {
    if (!vendorToken || !activeCall?.appointmentId) {
      return;
    }

    const appointmentId = activeCall.appointmentId;
    await healthVideoApi.endCall(vendorToken, appointmentId);
    clearCallSessionState(appointmentId);
    setActiveCall(null);
    navigatedCallAppointmentRef.current = null;
    clearIncomingCallUi();
    await clearPendingCallAction();
    await clearCallLaunchGuard();
  }, [
    vendorToken,
    activeCall,
    clearCallSessionState,
    clearIncomingCallUi,
  ]);

  const startCall = useCallback(
    async (appointmentId: number) => {
      if (!vendorToken) {
        return null;
      }
      const res = await healthVideoApi.startCall(vendorToken, appointmentId);
      const callData = (res.data || res) as AgoraCallData;
      setActiveCall(callData);
      navigateToActiveCall(callData);
      return callData;
    },
    [vendorToken, navigateToActiveCall],
  );

  // Socket-only helper — disabled along with the socket connection below.
  // const openActiveCall = useCallback(
  //   (payload: Record<string, any>) => {
  //     const callData = toAgoraCallData(payload);
  //     if (!callData) {
  //       return null;
  //     }
  //     setActiveCall(callData);
  //     clearIncomingCallUi();
  //     navigateToActiveCall(callData);
  //     return callData;
  //   },
  //   [clearIncomingCallUi, navigateToActiveCall],
  // );

  const presentIncomingCall = useCallback(
    (callData: IncomingCallData) => {
      // Each push ring is a fresh session — clear stale accept/navigation guards.
      recentlyHandledSessionsRef.current.delete(getCallSessionKey(callData));
      navigatedCallAppointmentRef.current = null;

      const normalized: IncomingCallData = {
        ...callData,
        appointmentId: Number(callData.appointmentId),
        playRingtone: callData.playRingtone !== false,
      };

      if (Platform.OS === 'android') {
        try {
          NativeModules.IncomingCallAlert?.clearNativeHandled?.();
        } catch {
          // Native module optional until rebuild
        }
        showBackgroundIncomingCall(normalized);
        // Foreground FCM skips the native push receiver — start ringtone here too.
        if (normalized.playRingtone !== false) {
          try {
            NativeModules.IncomingCallAlert?.startRingtoneService?.();
          } catch {
            // Native module optional until rebuild
          }
        }
        return;
      }

      setIncomingCall(normalized);
    },
    [],
  );

  const handleIncomingCallPush = useCallback(
    (data: Record<string, any>) => {
      if (!isIncomingCallPush(data)) {
        return;
      }

      const callData = parseIncomingCallPush(data);
      if (!callData) {
        return;
      }

      presentIncomingCall(callData);
    },
    [presentIncomingCall],
  );

  const processPendingCallAction = useCallback(async () => {
    if (processingPendingCallRef.current) {
      return false;
    }

    const pending = await loadPendingCallAction();
    if (!pending) {
      return false;
    }

    const token = vendorToken || (await loadVendorTokenFromStorage());
    if (!token) {
      return false;
    }

    processingPendingCallRef.current = true;

    try {
      clearIncomingCallUi({skipHideNotification: true});

      const appointmentId = Number(pending.data.appointmentId);
      markRecentlyHandled(pending.data);
      await markCallLaunchGuard(appointmentId);

      if (pending.action === 'accept') {
        const callData = await acceptIncomingCallFromPush(token, pending.data);
        setActiveCall(callData);
        clearIncomingCallUi({skipHideNotification: true});
        navigatedCallAppointmentRef.current = null;

        await waitForNavigationReady();
        if (Platform.OS === 'android') {
          await delay(800);
        }

        navigateToActiveCall(callData);
        flushPendingVideoCallNavigation();
        await delay(500);
        flushPendingVideoCallNavigation();
      } else {
        await rejectIncomingCallFromPush(token, pending.data);
        clearIncomingCallUi({skipHideNotification: true});
      }

      await clearPendingCallAction();
      await clearCallLaunchGuard();
      return true;
    } catch (error: any) {
      clearIncomingCallUi({skipHideNotification: true});
      await clearPendingCallAction();
      await clearCallLaunchGuard();
      setActiveCall(null);
      Toast.show({
        type: 'error',
        text1: 'Call action failed',
        text2: error?.message || 'Could not process incoming call',
      });
      return false;
    } finally {
      processingPendingCallRef.current = false;
    }
  }, [
    vendorToken,
    markRecentlyHandled,
    clearIncomingCallUi,
    navigateToActiveCall,
  ]);

  const registerFcmDevice = useCallback(
    async (token: string) => {
      const authToken = vendorToken || (await loadVendorTokenFromStorage());
      if (!authToken || !token || fcmTokenRef.current === token) {
        return;
      }

      try {
        await healthVideoApi.registerDevice(authToken, token, Platform.OS);
        fcmTokenRef.current = token;
      } catch (error) {
        console.warn('[VendorCall] registerDevice failed:', error);
      }
    },
    [vendorToken],
  );

  // ---------------------------------------------------------------------------
  // Socket-based call flow DISABLED — incoming calls now use FCM push only.
  // The handlers below were only consumed by the socket connection and are kept
  // commented for future re-enablement.
  // ---------------------------------------------------------------------------

  // const showSocketToast = useCallback((message: string) => {
  //   if (Platform.OS === 'android') {
  //     ToastAndroid.show(message, ToastAndroid.SHORT);
  //   }
  // }, []);

  // const pushNotification = useCallback((item: CallNotification) => {
  //   setNotifications(prev => [item, ...prev].slice(0, 50));
  // }, []);

  // const handleNotification = useCallback(
  //   (payload: CallNotification & {patientWaiting?: boolean}) => {
  //     pushNotification(payload);
  //     if (payload.patientWaiting && payload.appointmentId) {
  //       const appointmentId = Number(payload.appointmentId);
  //       if (shouldShowIncomingCall(appointmentId)) {
  //         setIncomingCall(
  //           prev =>
  //             prev || {
  //               appointmentId,
  //             },
  //         );
  //       }
  //     }
  //   },
  //   [pushNotification, shouldShowIncomingCall],
  // );

  // const handleCallWaitingRoom = useCallback(
  //   (payload: CallNotification & {patientWaiting?: boolean}) => {
  //     pushNotification({...payload, patientWaiting: true});
  //     const callData = toAgoraCallData(payload);
  //     if (callData) {
  //       openActiveCall(callData);
  //       return;
  //     }
  //     if (payload.appointmentId && shouldShowIncomingCall(Number(payload.appointmentId))) {
  //       setIncomingCall(
  //         prev =>
  //           prev || {
  //             appointmentId: Number(payload.appointmentId),
  //             patientName: payload.patientName,
  //           },
  //       );
  //     }
  //   },
  //   [openActiveCall, pushNotification, shouldShowIncomingCall],
  // );

  // const handleIncomingCall = useCallback(
  //   (payload: IncomingCallData) => {
  //     if (payload.participantRole && payload.participantRole !== 'receiver') {
  //       return;
  //     }
  //     if (!shouldShowIncomingCall(Number(payload.appointmentId))) {
  //       return;
  //     }
  //     setIncomingCall({
  //       ...payload,
  //       appointmentId: Number(payload.appointmentId),
  //       playRingtone: payload.playRingtone !== false,
  //     });
  //   },
  //   [shouldShowIncomingCall],
  // );

  // const handleCallAccepted = useCallback(
  //   (payload: AgoraCallData) => {
  //     openActiveCall(payload);
  //   },
  //   [openActiveCall],
  // );

  // const handleCallRejected = useCallback(() => {
  //   clearIncomingCallUi();
  //   setActiveCall(null);
  //   navigatedCallAppointmentRef.current = null;
  //   Toast.show({
  //     type: 'info',
  //     text1: 'Call rejected',
  //     text2: 'The consultation call was declined.',
  //   });
  // }, [clearIncomingCallUi]);

  // const handleCallEnded = useCallback(() => {
  //   if (activeCall?.appointmentId) {
  //     markCompletedCall(activeCall.appointmentId);
  //   }
  //   clearIncomingCallUi();
  //   setActiveCall(null);
  //   navigatedCallAppointmentRef.current = null;
  //   Toast.show({
  //     type: 'info',
  //     text1: 'Call ended',
  //     text2: 'The consultation has ended.',
  //   });
  // }, [activeCall, clearIncomingCallUi, markCompletedCall]);

  // Socket auto-connect disabled — incoming calls use FCM push only.
  // useEffect(() => {
  //   if (!vendorToken) {
  //     disconnectVendorHealthSocket();
  //     setSocketConnected(false);
  //     return;
  //   }
  //
  //   const token = vendorToken;
  //
  //   async function setup() {
  //     try {
  //       connectVendorHealthSocket({
  //         vendorToken: token,
  //         fcmToken: fcmTokenRef.current,
  //         platform: Platform.OS,
  //         onConnected: () => {
  //           setSocketConnected(true);
  //           showSocketToast('Socket connected');
  //         },
  //         onDisconnected: reason => {
  //           setSocketConnected(false);
  //           showSocketToast(`Socket disconnected: ${reason}`);
  //         },
  //         onError: msg => {
  //           setSocketConnected(false);
  //           console.warn('[VendorSocket] Error:', msg);
  //         },
  //         onNotification: handleNotification,
  //         onIncomingCall: handleIncomingCall,
  //         onCallWaitingRoom: handleCallWaitingRoom,
  //         onCallAccepted: handleCallAccepted,
  //         onCallRejected: handleCallRejected,
  //         onCallEnded: handleCallEnded,
  //       });
  //     } catch (error) {
  //       console.warn('[VendorSocket] Setup failed:', error);
  //     }
  //   }
  //
  //   setup();
  //
  //   return () => {
  //     disconnectVendorHealthSocket();
  //     setSocketConnected(false);
  //     stopIncomingRingtone();
  //   };
  // }, [
  //   vendorToken,
  //   handleNotification,
  //   handleIncomingCall,
  //   handleCallWaitingRoom,
  //   handleCallAccepted,
  //   handleCallRejected,
  //   handleCallEnded,
  //   showSocketToast,
  // ]);

  useEffect(() => {
    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function setupFcm() {
      try {
        await requestNotificationPermission();
        const token = await messaging().getToken();
        if (mounted && token) {
          await registerFcmDevice(token);
        }
      } catch (error) {
        console.warn('[VendorCall] FCM setup failed:', error);
      }
    }

    async function attemptPendingCallAction(attempt = 0) {
      if (!mounted) {
        return;
      }

      const processed = await processPendingCallAction();
      if (!mounted) {
        return;
      }

      const stillPending = await loadPendingCallAction();
      if (stillPending && !processed && attempt < 40) {
        retryTimer = setTimeout(() => {
          attemptPendingCallAction(attempt + 1);
        }, 500);
      }
    }

    setupFcm();
    attemptPendingCallAction();

    const unsubscribeToken = messaging().onTokenRefresh(async token => {
      await registerFcmDevice(token);
    });

    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      console.log('[FCM Push] Foreground message received:', {
        messageId: remoteMessage?.messageId,
        from: remoteMessage?.from,
        sentTime: remoteMessage?.sentTime,
        data: remoteMessage?.data,
        notification: remoteMessage?.notification,
      });
      handleIncomingCallPush(remoteMessage.data || {});
    });

    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        attemptPendingCallAction();
        flushPendingVideoCallNavigation();
      }
    });

    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      unsubscribeToken();
      unsubscribeMessage();
      appStateSub.remove();
    };
  }, [
    registerFcmDevice,
    processPendingCallAction,
    handleIncomingCallPush,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const parseNotificationCallData = (
      rawPayload?: string,
    ): IncomingCallData | null => {
      if (!rawPayload) {
        return null;
      }
      try {
        const parsed = JSON.parse(rawPayload) as Record<string, any>;
        return parseIncomingCallPush(parsed);
      } catch {
        return null;
      }
    };

    const onNotificationAnswer = async (data: {callUUID: string; payload?: string}) => {
      if (processingPendingCallRef.current) {
        return;
      }

      const pending = await loadPendingCallAction();
      if (pending?.action === 'accept') {
        // Killed-state accept is handled via pending action after main app boots.
        return;
      }

      const callData = parseNotificationCallData(data.payload);
      if (!callData) {
        return;
      }

      processingPendingCallRef.current = true;
      markRecentlyHandled(callData);

      try {
        const authToken = vendorToken || (await loadVendorTokenFromStorage());
        if (!authToken) {
          return;
        }

        await markCallLaunchGuard(callData.appointmentId);
        const callResult = await acceptIncomingCallFromPush(authToken, callData);
        setActiveCall(callResult);
        clearIncomingCallUi({skipHideNotification: true});
        navigatedCallAppointmentRef.current = null;
        await clearPendingCallAction();
        await clearCallLaunchGuard();

        await waitForNavigationReady();
        navigateToActiveCall(callResult);
        flushPendingVideoCallNavigation();
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Call failed',
          text2: error?.message || 'Could not accept call',
        });
      } finally {
        processingPendingCallRef.current = false;
      }
    };

    const onNotificationEndCall = async (data: {
      callUUID: string;
      payload?: string;
      endAction: 'ACTION_REJECTED_CALL' | 'ACTION_HIDE_CALL';
    }) => {
      if (processingPendingCallRef.current) {
        return;
      }

      const pending = await loadPendingCallAction();
      if (pending?.action === 'reject') {
        // Killed-state reject is handled via pending action after main app boots.
        clearIncomingCallUi({skipHideNotification: true});
        return;
      }

      const callData = parseNotificationCallData(data.payload);
      const sessionKey = callData ? getCallSessionKey(callData) : null;
      const recentlyHandled =
        sessionKey &&
        recentlyHandledSessionsRef.current.has(sessionKey) &&
        Date.now() - (recentlyHandledSessionsRef.current.get(sessionKey) || 0) <
          60_000;

      if (recentlyHandled || activeCallRef.current) {
        clearIncomingCallUi({skipHideNotification: true});
        return;
      }

      if (data.endAction === 'ACTION_HIDE_CALL') {
        clearIncomingCallUi();
        return;
      }

      if (processingPendingCallRef.current) {
        return;
      }

      if (!callData) {
        clearIncomingCallUi();
        return;
      }

      processingPendingCallRef.current = true;
      markRecentlyHandled(callData);

      try {
        const authToken = vendorToken || (await loadVendorTokenFromStorage());
        if (!authToken) {
          return;
        }

        await rejectIncomingCallFromPush(authToken, callData);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Reject failed',
          text2: error?.message || 'Could not reject call',
        });
      } finally {
        clearIncomingCallUi();
        await clearPendingCallAction();
        await clearCallLaunchGuard();
        processingPendingCallRef.current = false;
      }
    };

    RNNotificationCall.addEventListener('answer', onNotificationAnswer);
    RNNotificationCall.addEventListener('endCall', onNotificationEndCall);

    return () => {
      RNNotificationCall.removeEventListener('answer');
      RNNotificationCall.removeEventListener('endCall');
    };
  }, [
    vendorToken,
    markRecentlyHandled,
    clearIncomingCallUi,
    navigateToActiveCall,
  ]);

  useEffect(() => {
    if (incomingCall && incomingCall.playRingtone !== false) {
      startIncomingRingtone();
    } else {
      stopIncomingRingtone();
    }

    return () => {
      if (incomingCall) {
        stopIncomingRingtone();
      }
    };
  }, [incomingCall]);

  return (
    <VendorCallContext.Provider
      value={{
        socketConnected,
        incomingCall,
        activeCall,
        notifications,
        acceptCall,
        rejectCall,
        endCall,
        startCall,
        clearIncoming: clearIncomingCallUi,
      }}>
      {children}
    </VendorCallContext.Provider>
  );
}

export function useVendorCall() {
  const ctx = useContext(VendorCallContext);
  if (!ctx) {
    throw new Error('useVendorCall must be inside VendorCallProvider');
  }
  return ctx;
}

export async function handleBackgroundIncomingCallPush(
  data: Record<string, any>,
) {
  if (!isIncomingCallPush(data)) {
    return;
  }

  const callData = parseIncomingCallPush(data);
  if (!callData) {
    return;
  }

  // The native broadcast receiver (SooprsFirebaseMessagingReceiver) already
  // shows the full-screen UI when the app is backgrounded/killed. Skip the JS
  // path in that case to avoid a duplicate notification + double ringtone.
  if (
    Platform.OS === 'android' &&
    NativeModules.IncomingCallAlert?.wasHandledNatively
  ) {
    try {
      const handledNatively =
        await NativeModules.IncomingCallAlert.wasHandledNatively(
          String(callData.appointmentId),
        );
      if (handledNatively) {
        return;
      }
    } catch {
      // Native module optional until rebuild — fall through to JS handling.
    }
  }

  showBackgroundIncomingCall(callData);
}
