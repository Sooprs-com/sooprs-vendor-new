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
  onCallWaitingRoom?: (payload: any) => void;
  onCallAccepted?: (payload: any) => void;
  onCallRejected?: (payload: any) => void;
  onCallEnded?: (payload: any) => void;
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
  onCallWaitingRoom,
  onCallAccepted,
  onCallRejected,
  onCallEnded,
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
    '| Authorization:',
    bearerToken ? `${bearerToken.slice(0, 13)}...` : 'MISSING',
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
      '| description:',
      (err as any)?.description ?? null,
      '| context:',
      JSON.stringify((err as any)?.context ?? null),
      '| cause:',
      (err as any)?.cause?.message ?? null,
      '| data:',
      JSON.stringify((err as any)?.data ?? null),
    );
    onError?.(err.message);
  });

  socket.io.on('reconnect_attempt', attempt => {
    console.log('[VendorSocket] reconnect_attempt #', attempt);
  });

  socket.io.on('reconnect', attempt => {
    console.log('[VendorSocket] reconnected after', attempt, 'attempts');
  });

  socket.io.on('error', err => {
    console.log('[VendorSocket] manager error |', (err as any)?.message ?? err);
  });

  socket.io.engine.on('upgrade', () => {
    console.log(
      '[VendorSocket] transport upgraded ->',
      socket?.io?.engine?.transport?.name,
    );
  });

  socket.io.engine.on('close', reason => {
    console.log('[VendorSocket] engine close | reason:', reason);
  });

  socket.on('notification', payload => {
    console.log('[VendorSocket] notification event:', payload);
    onNotification?.(payload);
  });
  socket.on('incoming-call', payload => {
    console.log('[VendorSocket] incoming-call event:', payload);
    onIncomingCall?.(payload);
  });
  socket.on('call-waiting-room', payload => {
    console.log('[VendorSocket] call-waiting-room event:', payload);
    onCallWaitingRoom?.(payload);
  });
  socket.on('call-accepted', payload => {
    console.log('[VendorSocket] call-accepted event:', payload);
    onCallAccepted?.(payload);
  });
  socket.on('call-rejected', payload => {
    console.log('[VendorSocket] call-rejected event:', payload);
    onCallRejected?.(payload);
  });
  socket.on('call-ended', payload => {
    console.log('[VendorSocket] call-ended event:', payload);
    onCallEnded?.(payload);
  });

  return socket;
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
