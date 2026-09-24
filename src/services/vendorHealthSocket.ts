import {io, Socket} from 'socket.io-client';
import {HEALTH_VIDEO_CONFIG} from '../config/healthVideo';

let socket: Socket | null = null;

function normalizeAuthToken(token: string) {
  const cleaned = token.trim();
  if (!cleaned) {
    return {rawToken: '', bearerToken: ''};
  }
  const rawToken = /^Bearer\s+/i.test(cleaned)
    ? cleaned.replace(/^Bearer\s+/i, '')
    : cleaned;
  return {rawToken, bearerToken: `Bearer ${rawToken}`};
}

type ConnectOptions = {
  vendorToken: string;
  fcmToken?: string | null;
  platform?: string;
  onNotification?: (payload: any) => void;
  onIncomingCall?: (payload: any) => void;
  onPeerWaiting?: (payload: any) => void;
  onCallWaitingRoom?: (payload: any) => void;
  onCallAccepted?: (payload: any) => void;
  onPeerJoined?: (payload: any) => void;
  onParticipantDisconnected?: (payload: any) => void;
  onCallRejected?: (payload: any) => void;
  onCallEnded?: (payload: any) => void;
  onClientRated?: (payload: any) => void;
  onConnected?: () => void;
  onDisconnected?: (reason: string) => void;
  onError?: (message: string) => void;
};

export function connectVendorHealthSocket({
  vendorToken,
  fcmToken,
  platform = 'android',
  onNotification,
  onIncomingCall,
  onPeerWaiting,
  onCallWaitingRoom,
  onCallAccepted,
  onPeerJoined,
  onParticipantDisconnected,
  onCallRejected,
  onCallEnded,
  onClientRated,
  onConnected,
  onDisconnected,
  onError,
}: ConnectOptions) {
  disconnectVendorHealthSocket();
  const {rawToken, bearerToken} = normalizeAuthToken(vendorToken);

  if (!rawToken) {
    console.warn('[VendorSocket] Cannot connect — vendor JWT is missing');
    onError?.('Missing vendor token');
    return null;
  }

  const maskedToken = rawToken
    ? `${rawToken.slice(0, 6)}...${rawToken.slice(-4)} (len:${rawToken.length})`
    : 'MISSING';
  console.log(
    '[VendorSocket] Connecting to',
    HEALTH_VIDEO_CONFIG.SOCKET_URL,
    '| path:',
    HEALTH_VIDEO_CONFIG.SOCKET_PATH,
    '| token:',
    maskedToken,
    '| platform:',
    platform,
  );

  socket = io(HEALTH_VIDEO_CONFIG.SOCKET_URL, {
    path: HEALTH_VIDEO_CONFIG.SOCKET_PATH,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    forceNew: true,
    auth: {
      token: rawToken,
      platform,
      deviceToken: fcmToken || undefined,
    },
    extraHeaders: {
      Authorization: bearerToken,
    },
    transportOptions: {
      polling: {
        extraHeaders: {
          Authorization: bearerToken,
        },
      },
    },
  });

  socket.on('connect', () => {
    console.log(
      '[VendorSocket] connect | id:',
      socket?.id,
      '| transport:',
      socket?.io?.engine?.transport?.name,
    );
    socket?.emit('join-vendor-room');
    onConnected?.();
  });

  socket.on('disconnect', reason => {
    console.log('[VendorSocket] disconnect | reason:', reason);
    onDisconnected?.(reason);
  });

  socket.on('connect_error', err => {
    const transportName = socket?.io?.engine?.transport?.name ?? 'unknown';
    console.log(
      '[VendorSocket] connect_error |',
      err?.message,
      '| transport:',
      transportName,
    );
    onError?.(err.message);
  });

  socket.io.on('reconnect_attempt', attempt => {
    console.log('[VendorSocket] reconnect_attempt #', attempt);
  });

  socket.io.on('reconnect', attempt => {
    console.log('[VendorSocket] reconnected after', attempt, 'attempts');
    socket?.emit('join-vendor-room');
  });

  socket.on('notification', payload => {
    console.log('[VendorSocket] notification event:', payload);
    onNotification?.(payload);
  });
  socket.on('incoming-call', payload => {
    console.log('[VendorSocket] incoming-call event:', payload);
    onIncomingCall?.(payload);
  });
  socket.on('peer-waiting', payload => {
    console.log('[VendorSocket] peer-waiting event:', payload);
    onPeerWaiting?.(payload);
  });
  socket.on('call-waiting-room', payload => {
    console.log('[VendorSocket] call-waiting-room event:', payload);
    onCallWaitingRoom?.(payload);
  });
  socket.on('call-accepted', payload => {
    console.log('[VendorSocket] call-accepted event:', payload);
    onCallAccepted?.(payload);
  });
  socket.on('peer-joined', payload => {
    console.log('[VendorSocket] peer-joined event:', payload);
    onPeerJoined?.(payload);
  });
  socket.on('participant-disconnected', payload => {
    console.log('[VendorSocket] participant-disconnected event:', payload);
    onParticipantDisconnected?.(payload);
  });
  socket.on('call-rejected', payload => {
    console.log('[VendorSocket] call-rejected event:', payload);
    onCallRejected?.(payload);
  });
  socket.on('call-ended', payload => {
    console.log('[VendorSocket] call-ended event:', payload);
    onCallEnded?.(payload);
  });
  socket.on('client-rated', payload => {
    console.log('[VendorSocket] client-rated event:', payload);
    onClientRated?.(payload);
  });

  return socket;
}

export function emitLeaveRoom(appointmentId: number, reason = 'agora_disconnect') {
  if (!socket?.connected) {
    return false;
  }
  socket.emit('leave-room', {appointmentId, reason});
  socket.emit('agora-disconnected', {appointmentId, reason});
  return true;
}

export function disconnectVendorHealthSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getVendorSocket() {
  return socket;
}
