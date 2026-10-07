import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {IRtcEngine, IRtcEngineEventHandler} from 'react-native-agora';

export type CallViewSnapshot = {
  isJoined: boolean;
  isPreviewReady: boolean;
  remoteUid: number;
  isCameraOff: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isSwapped: boolean;
  isWaitingRoom: boolean;
  waitingOver: boolean;
  statusMessage: string;
  isInitializing: boolean;
  remoteLabel: string;
};

export type CallReturnRoute = {
  name: 'VideoCallScreen';
  params: Record<string, unknown>;
};

type CallMode = 'idle' | 'bubble' | 'fullscreen';

const EMPTY_SNAPSHOT: CallViewSnapshot = {
  isJoined: false,
  isPreviewReady: false,
  remoteUid: 0,
  isCameraOff: false,
  isMuted: false,
  isSpeakerOn: true,
  isSwapped: false,
  isWaitingRoom: false,
  waitingOver: true,
  statusMessage: '',
  isInitializing: false,
  remoteLabel: 'Patient',
};

type CallMediaApi = {
  hasEngine: () => boolean;
  peek: () => CallViewSnapshot | null;
  syncSnapshot: (snapshot: CallViewSnapshot) => void;
  getSnapshot: () => CallViewSnapshot;
  rememberEngine: (engine: IRtcEngine) => void;
  holdForBubble: (engine: IRtcEngine, handler: IRtcEngineEventHandler) => void;
  prepareExpand: () => void;
  claimForFullscreen: () => {engine: IRtcEngine; snapshot: CallViewSnapshot} | null;
  forgetEngine: () => void;
  releaseEngine: () => Promise<void>;
  patch: (partial: Partial<CallViewSnapshot>) => void;
  setReturnRoute: (route: CallReturnRoute) => void;
  getReturnRoute: () => CallReturnRoute | null;
};

type CallMediaContextValue = {
  mode: CallMode;
  snapshot: CallViewSnapshot;
  api: CallMediaApi;
};

const CallMediaContext = createContext<CallMediaContextValue | null>(null);

export function CallMediaProvider({children}: {children: React.ReactNode}) {
  const engineRef = useRef<IRtcEngine | null>(null);
  const bubbleHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
  const snapshotRef = useRef<CallViewSnapshot>(EMPTY_SNAPSHOT);
  const returnRouteRef = useRef<CallReturnRoute | null>(null);
  const [mode, setMode] = useState<CallMode>('idle');
  const [snapshot, setSnapshot] = useState<CallViewSnapshot>(EMPTY_SNAPSHOT);

  const publish = useCallback((next: CallViewSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const api = useMemo<CallMediaApi>(() => {
    return {
      hasEngine: () => engineRef.current != null,
      peek: () => (engineRef.current ? snapshotRef.current : null),
      syncSnapshot: next => {
        snapshotRef.current = next;
      },
      getSnapshot: () => snapshotRef.current,
      rememberEngine: engine => {
        engineRef.current = engine;
      },
      holdForBubble: (engine, handler) => {
        engineRef.current = engine;
        if (bubbleHandlerRef.current) {
          try {
            engine.unregisterEventHandler(bubbleHandlerRef.current);
          } catch {}
        }
        bubbleHandlerRef.current = handler;
        try {
          engine.registerEventHandler(handler);
        } catch {}
        setSnapshot(snapshotRef.current);
        setMode('bubble');
      },
      prepareExpand: () => {
        setMode('fullscreen');
      },
      claimForFullscreen: () => {
        const engine = engineRef.current;
        if (!engine) {
          return null;
        }
        if (bubbleHandlerRef.current) {
          try {
            engine.unregisterEventHandler(bubbleHandlerRef.current);
          } catch {}
          bubbleHandlerRef.current = null;
        }
        setMode('fullscreen');
        return {engine, snapshot: snapshotRef.current};
      },
      forgetEngine: () => {
        const engine = engineRef.current;
        if (engine && bubbleHandlerRef.current) {
          try {
            engine.unregisterEventHandler(bubbleHandlerRef.current);
          } catch {}
        }
        bubbleHandlerRef.current = null;
        engineRef.current = null;
        snapshotRef.current = EMPTY_SNAPSHOT;
        setSnapshot(EMPTY_SNAPSHOT);
        setMode('idle');
      },
      releaseEngine: async () => {
        const engine = engineRef.current;
        const handler = bubbleHandlerRef.current;
        bubbleHandlerRef.current = null;
        engineRef.current = null;
        snapshotRef.current = EMPTY_SNAPSHOT;
        setSnapshot(EMPTY_SNAPSHOT);
        setMode('idle');
        if (!engine) {
          return;
        }
        try {
          if (handler) {
            engine.unregisterEventHandler(handler);
          }
          engine.stopPreview();
          await engine.leaveChannel();
          engine.release();
        } catch {}
      },
      patch: partial => {
        const next = {...snapshotRef.current, ...partial};
        publish(next);
      },
      setReturnRoute: route => {
        returnRouteRef.current = route;
      },
      getReturnRoute: () => returnRouteRef.current,
    };
  }, [publish]);

  const value = useMemo(
    () => ({mode, snapshot, api}),
    [mode, snapshot, api],
  );

  return (
    <CallMediaContext.Provider value={value}>
      {children}
    </CallMediaContext.Provider>
  );
}

export function useCallMedia() {
  const ctx = useContext(CallMediaContext);
  if (!ctx) {
    throw new Error('useCallMedia must be used inside CallMediaProvider');
  }
  return ctx;
}
