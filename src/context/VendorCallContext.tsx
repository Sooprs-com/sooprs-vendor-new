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
import {
  connectVendorHealthSocket,
  disconnectVendorHealthSocket,
  emitLeaveRoom,
} from '../services/vendorHealthSocket';
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
  toAgoraCallData,
} from '../types/vendorCall';
import {
  flushPendingVideoCallNavigation,
  navigateToHealthAppointments,
  navigateToVideoCall,
  waitForNavigationReady,
} from '../router/navigationRef';
import {
  isIncomingCallPush,
  isSoftMissNotification,
  parseIncomingCallPush,
} from '../services/incomingCallTypes';
import {
  joinIncomingCallFromPush,
  rejectIncomingCallFromPush,
} from '../services/incomingCallActions';
import {
  clearPendingCallAction,
  loadPendingCallAction,
  savePendingCallAction,
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

type EndCallResult = {
  showRating?: boolean;
  canRate?: boolean;
  uiAction?: string;
  ratingStatus?: string;
  clientRating?: any;
  talkDurationSeconds?: number | null;
  status?: string;
  endReason?: string;
  [key: string]: any;
};

export type ClientRatedEvent = {
  appointmentId?: number;
  orderId?: number;
  clientRating?: any;
  ratingStatus?: string;
  at: number;
};

/** Vendor never rates — only patient can. Always close call → after-call summary. */
function vendorShouldShowRating(_payload?: Record<string, any> | null): false {
  return false;
}

type VendorCallContextValue = {
  socketConnected: boolean;
  incomingCall: IncomingCallData | null;
  activeCall: AgoraCallData | null;
  notifications: CallNotification[];
  canRejoin: boolean;
  lastEndedCall: EndCallResult | null;
  /** Fires when patient submits a rating — screens refresh read-only display */
  lastClientRated: ClientRatedEvent | null;
  /** Primary CTA — POST /call/join-room */
  joinCall: (appointmentId?: number) => Promise<AgoraCallData | null>;
  /** Alias kept for older UI refs — same as joinCall */
  acceptCall: () => Promise<AgoraCallData | null>;
  rejectCall: (reason?: string) => Promise<void>;
  /** Explicit hang-up only — POST /call/end */
  endCall: () => Promise<EndCallResult | null>;
  /** Temporary drop — POST /call/leave-room (do NOT end meeting) */
  leaveRoom: (reason?: string) => Promise<{canRejoin: boolean} | null>;
  rejoinCall: () => Promise<AgoraCallData | null>;
  startCall: (appointmentId: number) => Promise<AgoraCallData | null>;
  clearIncoming: () => void;
  clearLastEndedCall: () => void;
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
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState<CallNotification[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<AgoraCallData | null>(null);
  const [canRejoin, setCanRejoin] = useState(false);
  const [lastEndedCall, setLastEndedCall] = useState<EndCallResult | null>(null);
  const [lastClientRated, setLastClientRated] =
    useState<ClientRatedEvent | null>(null);
  const [rejoinAppointmentId, setRejoinAppointmentId] = useState<number | null>(
    null,
  );

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

  const clearIncomingCallUi = useCallback(
    (options?: {skipHideNotification?: boolean}) => {
      setIncomingCall(null);
      stopIncomingRingtone();
      if (!options?.skipHideNotification) {
        hideIncomingCallNotification();
      }
      if (Platform.OS === 'android') {
        try {
          NativeModules.IncomingCallAlert?.stopRingtoneService?.();
        } catch {
          // Native module optional until rebuild
        }
      }
    },
    [],
  );

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
    setCanRejoin(false);
    setRejoinAppointmentId(callData.appointmentId);
    navigateToVideoCall({
      channelName: callData.channelName,
      token: callData.token,
      appId: callData.appId,
      uid: callData.uid,
      appointmentId: callData.appointmentId,
      callKey: sessionKey,
      uiAction: callData.uiAction,
      status: callData.status,
      bothPresent: callData.bothPresent,
    });
    flushPendingVideoCallNavigation();
  }, []);

  const openActiveCall = useCallback(
    (payload: Record<string, any>) => {
      const callData = toAgoraCallData(payload);
      if (!callData) {
        return null;
      }
      setActiveCall(callData);
      clearIncomingCallUi();
      navigateToActiveCall(callData);
      return callData;
    },
    [clearIncomingCallUi, navigateToActiveCall],
  );

  const joinCall = useCallback(
    async (appointmentId?: number) => {
      const targetId = appointmentId || incomingCall?.appointmentId;
      if (!vendorToken || !targetId) {
        return null;
      }

      if (incomingCall) {
        markRecentlyHandled(incomingCall);
      }

      // Soft-leave / reconnect: always re-fetch Agora creds via join-room
      // (same meeting — never POST /call/end or /call/start).
      const res = await healthVideoApi.joinRoom(vendorToken, targetId);
      const raw = (res.data || res) as Record<string, any>;
      const callData = toAgoraCallData({appointmentId: targetId, ...raw});
      if (!callData) {
        throw new Error('Invalid call credentials received from server');
      }

      setCanRejoin(false);
      setRejoinAppointmentId(targetId);
      setActiveCall(callData);
      clearIncomingCallUi();
      await clearPendingCallAction();
      await clearCallLaunchGuard();
      navigateToActiveCall(callData);
      return callData;
    },
    [
      vendorToken,
      incomingCall,
      markRecentlyHandled,
      clearIncomingCallUi,
      navigateToActiveCall,
    ],
  );

  const acceptCall = useCallback(async () => {
    return joinCall();
  }, [joinCall]);

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
      return null;
    }

    const appointmentId = activeCall.appointmentId;
    const res = await healthVideoApi.endCall(vendorToken, appointmentId);
    const raw = (res.data || res || {}) as Record<string, any>;
    const meeting = raw.meeting || {};
    // Ignore HTTP /call/end patient flags (show_rating / canRate / rateEndpoint).
    // Vendor after-call UI is driven by socket/push (meeting_closed, canRate: false).
    const result: EndCallResult = {
      ...raw,
      showRating: vendorShouldShowRating(raw),
      canRate: false,
      uiAction: 'meeting_closed',
      talkDurationSeconds:
        raw.talkDurationSeconds ?? meeting.talkDurationSeconds,
      status: raw.status,
      endReason: raw.endReason ?? meeting.endReason,
      appointmentId,
      userJoinedAt: meeting.userJoinedAt || raw.userJoinedAt,
      vendorJoinedAt: meeting.vendorJoinedAt || raw.vendorJoinedAt,
      meeting,
    };

    clearCallSessionState(appointmentId);
    setActiveCall(null);
    setCanRejoin(false);
    setRejoinAppointmentId(null);
    navigatedCallAppointmentRef.current = null;
    clearIncomingCallUi();
    setLastEndedCall(result);
    await clearPendingCallAction();
    await clearCallLaunchGuard();
    return result;
  }, [
    vendorToken,
    activeCall,
    clearCallSessionState,
    clearIncomingCallUi,
  ]);

  const leaveRoom = useCallback(
    async (reason = 'agora_disconnect') => {
      const appointmentId =
        activeCall?.appointmentId || rejoinAppointmentId || null;
      if (!vendorToken || !appointmentId) {
        return null;
      }

      try {
        emitLeaveRoom(appointmentId, reason);
        const res = await healthVideoApi.leaveRoom(
          vendorToken,
          appointmentId,
          reason,
        );
        const raw = (res.data || res || {}) as Record<string, any>;
        const stillOpen = raw.meetingStillOpen !== false;
        const rejoinAllowed = raw.canRejoin !== false && stillOpen;
        setCanRejoin(rejoinAllowed);
        setRejoinAppointmentId(appointmentId);
        // Keep activeCall null so UI can show Rejoin — do NOT complete meeting.
        setActiveCall(null);
        return {canRejoin: rejoinAllowed};
      } catch (error) {
        setCanRejoin(true);
        setRejoinAppointmentId(appointmentId);
        setActiveCall(null);
        return {canRejoin: true};
      }
    },
    [vendorToken, activeCall, rejoinAppointmentId],
  );

  const rejoinCall = useCallback(async () => {
    const appointmentId =
      rejoinAppointmentId || activeCall?.appointmentId || null;
    if (!appointmentId) {
      return null;
    }
    return joinCall(appointmentId);
  }, [rejoinAppointmentId, activeCall, joinCall]);

  const startCall = useCallback(
    async (appointmentId: number) => {
      // New flow: join-room is primary (window must be open).
      return joinCall(appointmentId);
    },
    [joinCall],
  );

  const clearLastEndedCall = useCallback(() => {
    setLastEndedCall(null);
  }, []);

  const presentIncomingCall = useCallback(
    (callData: IncomingCallData) => {
      // Soft miss = reminder only. Do NOT show full-screen ring / close the meeting.
      if (callData.softMiss) {
        Toast.show({
          type: 'info',
          text1: 'Reminder',
          text2: 'Meeting still open — you can still Join',
        });
        navigateToHealthAppointments(callData.appointmentId);
        return;
      }

      recentlyHandledSessionsRef.current.delete(getCallSessionKey(callData));
      navigatedCallAppointmentRef.current = null;

      const normalized: IncomingCallData = {
        ...callData,
        appointmentId: Number(callData.appointmentId),
        playRingtone: callData.playRingtone !== false,
        acceptButtonLabel:
          callData.acceptButtonLabel ||
          (callData.isPeerWaiting ? 'Join now' : 'Join'),
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
        // Android uses full-screen notification UI (IncomingCallModal is iOS-only).
        return;
      }

      setIncomingCall(normalized);
    },
    [],
  );

  const handleIncomingCallPush = useCallback(
    (data: Record<string, any>) => {
      // Soft-miss notification → reminder + Appointment detail (Join still ON).
      if (isSoftMissNotification(data)) {
        Toast.show({
          type: 'info',
          text1: 'Reminder',
          text2: 'Meeting still open — you can still Join',
        });
        const appointmentId = Number(
          data.appointmentId || data?.data?.appointmentId,
        );
        navigateToHealthAppointments(
          Number.isFinite(appointmentId) && appointmentId > 0
            ? appointmentId
            : null,
        );
        return;
      }

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
      // Nothing pending — report done so the retry loop stops.
      return true;
    }

    // Wait for the app to be in the foreground before joining / navigating.
    // On a locked launch this becomes true once MainActivity resumes over the keyguard.
    if (AppState.currentState !== 'active') {
      return false;
    }

    const token = vendorToken || (await loadVendorTokenFromStorage());
    if (!token) {
      // Auth not restored yet on cold start — retry shortly.
      return false;
    }

    // For accept/join we must land on the call screen. Wait for navigation
    // before consuming the action, otherwise a slow cold-start drops the accept.
    if (pending.action === 'accept' || pending.action === 'join') {
      const navReady = await waitForNavigationReady();
      if (!navReady) {
        return false;
      }
    }

    processingPendingCallRef.current = true;

    try {
      clearIncomingCallUi({skipHideNotification: true});

      const appointmentId = Number(pending.data.appointmentId);
      markRecentlyHandled(pending.data);
      await markCallLaunchGuard(appointmentId);

      if (pending.action === 'accept' || pending.action === 'join') {
        const callData = await joinIncomingCallFromPush(token, pending.data);
        setActiveCall(callData);
        clearIncomingCallUi({skipHideNotification: true});
        navigatedCallAppointmentRef.current = null;

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

      // Only clear after successful join/reject + navigate so retries can recover.
      await clearPendingCallAction();
      await clearCallLaunchGuard();
      return true;
    } catch (error: any) {
      // Keep the pending action so the retry loop can try again (user-app behaviour).
      // Do NOT clearPendingCallAction here — early token/nav failures were wiping Accept.
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
      }
    },
    [vendorToken],
  );

  // Ensure FCM register runs again after login (token was cleared on logout).
  useEffect(() => {
    if (!vendorToken) {
      fcmTokenRef.current = null;
      return;
    }
    messaging()
      .getToken()
      .then(token => {
        if (token) {
          registerFcmDevice(token);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [vendorToken, registerFcmDevice]);

  const pushNotification = useCallback((item: CallNotification) => {
    setNotifications(prev => [item, ...prev].slice(0, 50));
  }, []);

  const handleNotification = useCallback(
    (payload: CallNotification) => {
      pushNotification(payload);

      // Soft miss = reminder only; Join stays ON.
      if (isSoftMissNotification(payload) || payload.softMiss) {
        Toast.show({
          type: 'info',
          text1: 'Reminder',
          text2:
            payload.message ||
            'Patient may be waiting — meeting is still open',
        });
        navigateToHealthAppointments(
          payload.appointmentId ? Number(payload.appointmentId) : null,
        );
        return;
      }
    },
    [pushNotification],
  );

  const handleIncomingCall = useCallback(
    (payload: IncomingCallData) => {
      if (payload.participantRole && payload.participantRole !== 'receiver') {
        return;
      }
      const callData = parseIncomingCallPush(payload as any) || {
        ...payload,
        appointmentId: Number(payload.appointmentId),
        acceptButtonLabel: payload.acceptButtonLabel || 'Join',
        playRingtone: payload.playRingtone !== false,
      };
      presentIncomingCall(callData);
    },
    [presentIncomingCall],
  );

  const handlePeerWaiting = useCallback(
    (payload: Record<string, any>) => {
      const callData = parseIncomingCallPush({
        ...payload,
        event: 'peer-waiting',
        uiAction: payload.uiAction || 'show_peer_waiting_join',
        acceptButtonLabel: payload.acceptButtonLabel || 'Join now',
        playRingtone: payload.playRingtone !== false,
      });
      if (!callData) {
        return;
      }
      presentIncomingCall({
        ...callData,
        isPeerWaiting: true,
        acceptButtonLabel: 'Join now',
      });
    },
    [presentIncomingCall],
  );

  const handleCallWaitingRoom = useCallback(
    (payload: Record<string, any>) => {
      pushNotification({...payload, type: 'waiting'});
      const callData = toAgoraCallData(payload);
      if (callData) {
        openActiveCall({
          ...callData,
          uiAction: callData.uiAction || 'join_agora_and_wait',
          status: callData.status || 'waiting',
          bothPresent: false,
        });
      }
    },
    [openActiveCall, pushNotification],
  );

  const handleCallAccepted = useCallback(
    (payload: Record<string, any>) => {
      openActiveCall({
        ...payload,
        uiAction: payload.uiAction || 'join_agora_in_call',
        status: payload.status || 'in_progress',
        bothPresent: true,
      });
    },
    [openActiveCall],
  );

  const handlePeerJoined = useCallback(
    (payload: Record<string, any>) => {
      // Patient joined after doctor was waiting — refresh to in-call UI.
      if (activeCallRef.current) {
        setActiveCall(prev =>
          prev
            ? {
                ...prev,
                status: 'in_progress',
                bothPresent: true,
                uiAction: 'join_agora_in_call',
                ...payload,
              }
            : prev,
        );
        return;
      }
      openActiveCall({
        ...payload,
        status: 'in_progress',
        bothPresent: true,
        uiAction: 'join_agora_in_call',
      });
    },
    [openActiveCall],
  );

  const handleParticipantDisconnected = useCallback(
    (payload: Record<string, any>) => {
      // Do NOT call /call/end — show reconnecting / rejoin.
      Toast.show({
        type: 'info',
        text1: 'Reconnecting…',
        text2: payload?.message || 'Peer disconnected — you can rejoin',
      });
      if (payload?.canRejoin !== false) {
        setCanRejoin(true);
        if (payload?.appointmentId) {
          setRejoinAppointmentId(Number(payload.appointmentId));
        }
      }
    },
    [],
  );

  const handleCallRejected = useCallback(() => {
    clearIncomingCallUi();
    setActiveCall(null);
    setCanRejoin(false);
    navigatedCallAppointmentRef.current = null;
    Toast.show({
      type: 'info',
      text1: 'Call rejected',
      text2: 'The consultation call was declined.',
    });
  }, [clearIncomingCallUi]);

  const handleCallEnded = useCallback(
    (payload: Record<string, any>) => {
      const appointmentId =
        Number(payload?.appointmentId) || activeCallRef.current?.appointmentId;
      if (appointmentId) {
        clearCallSessionState(appointmentId);
      }
      clearIncomingCallUi();
      setActiveCall(null);
      setCanRejoin(false);
      setRejoinAppointmentId(null);
      navigatedCallAppointmentRef.current = null;
      const meeting = payload?.meeting || {};
      // Vendor socket/push: uiAction meeting_closed, canRate false → summary only.
      setLastEndedCall({
        ...payload,
        showRating: vendorShouldShowRating(payload),
        canRate: false,
        uiAction: payload?.uiAction || 'meeting_closed',
        talkDurationSeconds:
          payload?.talkDurationSeconds ?? meeting.talkDurationSeconds,
        status: payload?.status,
        endReason: payload?.endReason ?? meeting.endReason,
        appointmentId,
        userJoinedAt: meeting.userJoinedAt || payload?.userJoinedAt,
        vendorJoinedAt: meeting.vendorJoinedAt || payload?.vendorJoinedAt,
        meeting,
        clientRating: payload?.clientRating ?? null,
        ratingStatus: payload?.ratingStatus,
      });
    },
    [clearIncomingCallUi, clearCallSessionState],
  );

  const handleClientRated = useCallback((payload: Record<string, any>) => {
    const appointmentId = payload?.appointmentId
      ? Number(payload.appointmentId)
      : undefined;
    const orderId = payload?.orderId ? Number(payload.orderId) : undefined;
    setLastClientRated({
      appointmentId: appointmentId && !Number.isNaN(appointmentId)
        ? appointmentId
        : undefined,
      orderId: orderId && !Number.isNaN(orderId) ? orderId : undefined,
      clientRating: payload?.clientRating ?? null,
      ratingStatus: payload?.ratingStatus,
      at: Date.now(),
    });
  }, []);

  // Socket + FCM: socket for live peer-waiting / disconnect; FCM for killed-state rings.
  useEffect(() => {
    if (!vendorToken) {
      disconnectVendorHealthSocket();
      setSocketConnected(false);
      return;
    }

    const token = vendorToken;

    connectVendorHealthSocket({
      vendorToken: token,
      fcmToken: fcmTokenRef.current,
      platform: Platform.OS,
      onConnected: () => setSocketConnected(true),
      onDisconnected: () => setSocketConnected(false),
      onError: msg => {
        setSocketConnected(false);
      },
      onNotification: handleNotification,
      onIncomingCall: handleIncomingCall,
      onPeerWaiting: handlePeerWaiting,
      onCallWaitingRoom: handleCallWaitingRoom,
      onCallAccepted: handleCallAccepted,
      onPeerJoined: handlePeerJoined,
      onParticipantDisconnected: handleParticipantDisconnected,
      onCallRejected: handleCallRejected,
      onCallEnded: handleCallEnded,
      onClientRated: handleClientRated,
    });

    return () => {
      disconnectVendorHealthSocket();
      setSocketConnected(false);
      stopIncomingRingtone();
    };
  }, [
    vendorToken,
    handleNotification,
    handleIncomingCall,
    handlePeerWaiting,
    handleCallWaitingRoom,
    handleCallAccepted,
    handlePeerJoined,
    handleParticipantDisconnected,
    handleCallRejected,
    handleCallEnded,
    handleClientRated,
  ]);

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
      handleIncomingCallPush(remoteMessage.data || {});
    });

    const openFromNotification = (remoteMessage: any) => {
      const data = (remoteMessage?.data || {}) as Record<string, any>;
      if (isSoftMissNotification(data)) {
        handleIncomingCallPush(data);
        return;
      }
      if (isIncomingCallPush(data)) {
        handleIncomingCallPush(data);
        return;
      }
      const appointmentId = Number(data.appointmentId);
      if (Number.isFinite(appointmentId) && appointmentId > 0) {
        navigateToHealthAppointments(appointmentId);
      }
    };

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      openFromNotification,
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          openFromNotification(remoteMessage);
        }
      })
      .catch(() => {
        // ignore cold-start notification errors
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
      unsubscribeOpened();
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

    const onNotificationAnswer = async (data: {
      callUUID: string;
      payload?: string;
    }) => {
      // FullScreenIncomingCall already persisted accept + launched MainActivity.
      // Prefer the pending-action retry loop (waits for AppState + nav ready)
      // instead of joining immediately from this listener.
      const pending = await loadPendingCallAction();
      if (pending?.action === 'accept' || pending?.action === 'join') {
        processPendingCallAction();
        return;
      }

      const callData = parseNotificationCallData(data.payload);
      if (!callData) {
        return;
      }

      try {
        await savePendingCallAction({
          action: 'accept',
          savedAt: Date.now(),
          data: callData,
        });
        await markCallLaunchGuard(callData.appointmentId);
      } catch (e) {
      }

      if (NativeModules.IncomingCallAlert?.launchMainApp) {
        NativeModules.IncomingCallAlert.launchMainApp();
      }

      processPendingCallAction();
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
    processPendingCallAction,
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
        canRejoin,
        lastEndedCall,
        lastClientRated,
        joinCall,
        acceptCall,
        rejectCall,
        endCall,
        leaveRoom,
        rejoinCall,
        startCall,
        clearIncoming: clearIncomingCallUi,
        clearLastEndedCall,
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
