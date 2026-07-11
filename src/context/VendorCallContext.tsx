import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {AppState, Platform, ToastAndroid} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectVendorHealthSocket,
  disconnectVendorHealthSocket,
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
import {navigateToVideoCall} from '../router/navigationRef';
import Toast from 'react-native-toast-message';

type VendorCallContextValue = {
  socketConnected: boolean;
  incomingCall: IncomingCallData | null;
  activeCall: AgoraCallData | null;
  notifications: CallNotification[];
  acceptCall: () => Promise<AgoraCallData | null>;
  rejectCall: (reason?: string) => Promise<void>;
  endCall: () => Promise<void>;
  clearIncoming: () => void;
};

const VendorCallContext = createContext<VendorCallContextValue | null>(null);

function isLoggedInValue(value: string | null) {
  return value === 'TRUE' || value === 'true' || value === '1';
}

function sanitizeToken(value: string | null) {
  if (!value) {
    return null;
  }
  // Handles accidental JSON-stringified values like "\"eyJ...\""
  return value.replace(/^"+|"+$/g, '').trim();
}

export function VendorCallProvider({children}: {children: React.ReactNode}) {
  const [vendorToken, setVendorToken] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<AgoraCallData | null>(null);
  const [notifications, setNotifications] = useState<CallNotification[]>([]);
  const fcmTokenRef = useRef<string | null>(null);

  const showSocketToast = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  }, []);

  const pushNotification = useCallback((item: CallNotification) => {
    setNotifications(prev => [item, ...prev].slice(0, 50));
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

  const acceptCall = useCallback(async () => {
    if (!vendorToken || !incomingCall?.appointmentId) {
      return null;
    }
    const res = await healthVideoApi.acceptCall(
      vendorToken,
      incomingCall.appointmentId,
    );
    const callData = (res.data || res) as AgoraCallData;
    setActiveCall(callData);
    setIncomingCall(null);
    stopIncomingRingtone();
    return callData;
  }, [vendorToken, incomingCall]);

  const rejectCall = useCallback(
    async (reason = 'declined_by_vendor') => {
      if (!vendorToken || !incomingCall?.appointmentId) {
        return;
      }
      await healthVideoApi.rejectCall(
        vendorToken,
        reason,
        incomingCall.appointmentId,
      );
      setIncomingCall(null);
      stopIncomingRingtone();
    },
    [vendorToken, incomingCall],
  );

  const endCall = useCallback(async () => {
    if (!vendorToken || !activeCall?.appointmentId) {
      return;
    }
    await healthVideoApi.endCall(vendorToken, activeCall.appointmentId);
    setActiveCall(null);
  }, [vendorToken, activeCall]);

  const openActiveCall = useCallback((payload: Record<string, any>) => {
    const callData = toAgoraCallData(payload);
    if (!callData) {
      return null;
    }
    setActiveCall(callData);
    setIncomingCall(null);
    stopIncomingRingtone();
    navigateToVideoCall({
      channelName: callData.channelName,
      token: callData.token,
      appId: callData.appId,
      uid: callData.uid,
      appointmentId: callData.appointmentId,
    });
    return callData;
  }, []);

  const handleNotification = useCallback(
    (payload: CallNotification & {patientWaiting?: boolean}) => {
      pushNotification(payload);
      if (
        typeof payload?.message === 'string' &&
        payload.message.toLowerCase().includes('joined vendor room')
      ) {
        console.log('[VendorSocket] Joined vendor room confirmed');
      }
      if (payload.patientWaiting && payload.appointmentId) {
        setIncomingCall(
          prev =>
            prev || {
              appointmentId: Number(payload.appointmentId),
            },
        );
      }
    },
    [pushNotification],
  );

  const handleCallWaitingRoom = useCallback(
    (payload: CallNotification & {patientWaiting?: boolean}) => {
      pushNotification({...payload, patientWaiting: true});
      const callData = toAgoraCallData(payload);
      if (callData) {
        openActiveCall(callData);
        return;
      }
      if (payload.appointmentId) {
        setIncomingCall(
          prev =>
            prev || {
              appointmentId: Number(payload.appointmentId),
              patientName: payload.patientName,
            },
        );
      }
    },
    [openActiveCall, pushNotification],
  );

  const handleIncomingCall = useCallback((payload: IncomingCallData) => {
    if (payload.participantRole && payload.participantRole !== 'receiver') {
      return;
    }
    setIncomingCall({
      ...payload,
      appointmentId: Number(payload.appointmentId),
      playRingtone: payload.playRingtone !== false,
    });
  }, []);

  const handleCallAccepted = useCallback(
    (payload: AgoraCallData) => {
      openActiveCall(payload);
    },
    [openActiveCall],
  );

  const handleCallRejected = useCallback(() => {
    setIncomingCall(null);
    setActiveCall(null);
    stopIncomingRingtone();
    Toast.show({
      type: 'info',
      text1: 'Call rejected',
      text2: 'The consultation call was declined.',
    });
  }, []);

  const handleCallEnded = useCallback(() => {
    setIncomingCall(null);
    setActiveCall(null);
    stopIncomingRingtone();
    Toast.show({
      type: 'info',
      text1: 'Call ended',
      text2: 'The consultation has ended.',
    });
  }, []);

  useEffect(() => {
    if (!vendorToken) {
      disconnectVendorHealthSocket();
      setSocketConnected(false);
      return;
    }

    const token = vendorToken;

    async function setup() {
      try {
        connectVendorHealthSocket({
          vendorToken: token,
          fcmToken: fcmTokenRef.current,
          platform: Platform.OS,
          onConnected: () => {
            console.log('[VendorSocket] Connected & joined vendor room');
            showSocketToast('Socket connected');
            setSocketConnected(true);
          },
          onDisconnected: reason => {
            console.log('[VendorSocket] Disconnected:', reason);
            showSocketToast(`Socket disconnected: ${reason}`);
            setSocketConnected(false);
          },
          onError: msg => {
            setSocketConnected(false);
            console.warn('[VendorSocket] Error:', msg);
            showSocketToast(`Socket error: ${msg}`);
          },
          onNotification: handleNotification,
          onIncomingCall: handleIncomingCall,
          onCallWaitingRoom: handleCallWaitingRoom,
          onCallAccepted: handleCallAccepted,
          onCallRejected: handleCallRejected,
          onCallEnded: handleCallEnded,
        });
      } catch (error) {
        console.warn('[VendorSocket] Setup failed:', error);
      }
    }

    setup();

    return () => {
      disconnectVendorHealthSocket();
      setSocketConnected(false);
      stopIncomingRingtone();
    };
  }, [
    vendorToken,
    handleNotification,
    handleIncomingCall,
    handleCallWaitingRoom,
    handleCallAccepted,
    handleCallRejected,
    handleCallEnded,
    showSocketToast,
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
        clearIncoming: () => {
          setIncomingCall(null);
          stopIncomingRingtone();
        },
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
