import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  RtcConnection,
  IRtcEngineEventHandler,
  RenderModeType,
  VideoSourceType,
} from 'react-native-agora';
import Toast from 'react-native-toast-message';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {useVendorCall} from '../../context/VendorCallContext';
import {leaveVideoCallScreen} from '../../router/navigationRef';

type VideoCallRouteParams = {
  role?: 'user' | 'vendor';
  channelName?: string;
  token?: string;
  appId?: string;
  uid?: number;
  appointmentId?: number;
  callKey?: string;
  uiAction?: string;
  status?: string;
  bothPresent?: boolean;
};

const getPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
};

const VideoCallScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params || {}) as VideoCallRouteParams;
  const {
    endCall,
    leaveRoom,
    rejoinCall,
    canRejoin,
    lastEndedCall,
    clearLastEndedCall,
    activeCall,
  } = useVendorCall();

  const role = params.role ?? 'vendor';
  // Prefer live activeCall (rejoin refreshes creds without remounting params).
  const channelName = activeCall?.channelName || params.channelName;
  const agoraToken = activeCall?.token || params.token;
  const agoraAppId = activeCall?.appId || params.appId;
  const uid = activeCall?.uid ?? params.uid;
  const hasRemoteCallCredentials = Boolean(
    channelName && agoraToken && agoraAppId && uid != null,
  );
  const callKey =
    params.callKey ??
    activeCall?.callSessionId ??
    `${activeCall?.appointmentId ?? params.appointmentId ?? channelName}-${String(
      agoraToken || '',
    ).slice(0, 8)}`;

  const isVendor = role === 'vendor';
  const roleLabel = isVendor ? 'Vendor (Doctor)' : 'User (Patient)';
  const remoteLabel = isVendor ? 'Patient' : 'Doctor';

  const initialWaiting =
    params.uiAction === 'join_agora_and_wait' ||
    params.status === 'waiting' ||
    params.bothPresent === false ||
    activeCall?.uiAction === 'join_agora_and_wait' ||
    activeCall?.status === 'waiting' ||
    activeCall?.bothPresent === false;

  const agoraEngineRef = useRef<IRtcEngine>();
  const eventHandler = useRef<IRtcEngineEventHandler>();
  const intentionalLeaveRef = useRef(false);
  const leavingRef = useRef(false);
  /** Allows navigation after soft-leave / end call. */
  const allowNavigateAwayRef = useRef(false);
  const softLeavingRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  /** True only after Agora onJoinChannelSuccess — guards false disconnects. */
  const hasJoinedOnceRef = useRef(false);

  const [isScreenSettled, setIsScreenSettled] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    initialWaiting ? 'Waiting for patient…' : 'Connecting…',
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [waitingForPatient, setWaitingForPatient] = useState(initialWaiting);
  const [disconnected, setDisconnected] = useState(false);
  const [rejoining, setRejoining] = useState(false);

  useEffect(() => {
    if (activeCall?.status === 'in_progress' || activeCall?.bothPresent) {
      setWaitingForPatient(false);
      setStatusMessage('Connected');
    } else if (
      activeCall?.status === 'waiting' ||
      activeCall?.uiAction === 'join_agora_and_wait'
    ) {
      setWaitingForPatient(true);
      setStatusMessage('Waiting for patient…');
    }
  }, [activeCall?.status, activeCall?.bothPresent, activeCall?.uiAction]);

  const handleAgoraDisconnect = useCallback(async () => {
    if (
      intentionalLeaveRef.current ||
      leavingRef.current ||
      softLeavingRef.current ||
      !hasJoinedOnceRef.current
    ) {
      // Ignore pre-join / initial Disconnected blips — they are normal during
      // Agora connect and were forcing a false "Rejoin" on first land.
      return;
    }
    leavingRef.current = true;
    setStatusMessage('Connection lost — meeting still open');
    setDisconnected(true);
    try {
      // Temporary drop — do NOT call /call/end
      await leaveRoom('agora_disconnect');
    } catch (e) {
    } finally {
      leavingRef.current = false;
    }
  }, [leaveRoom]);

  const joinChannel = useCallback(async () => {
    if (!agoraToken || !channelName || uid == null) {
      return;
    }
    try {
      await agoraEngineRef.current?.joinChannel(agoraToken, channelName, uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
    } catch (e) {
      setStatusMessage('Failed to join channel');
    }
  }, [agoraToken, channelName, uid]);

  const setupEventHandler = useCallback(() => {
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        hasJoinedOnceRef.current = true;
        setStatusMessage(
          waitingForPatient ? 'Waiting for patient…' : 'Connected',
        );
        setIsJoined(true);
        setIsInitializing(false);
        setDisconnected(false);
      },
      onUserJoined: (_connection: RtcConnection, remoteUserUid: number) => {
        setStatusMessage(`${remoteLabel} joined`);
        setRemoteUid(remoteUserUid);
        setWaitingForPatient(false);
      },
      onUserOffline: (_connection: RtcConnection, remoteUserUid: number) => {
        setStatusMessage(`${remoteLabel} left — reconnecting…`);
        setRemoteUid(prev => (prev === remoteUserUid ? 0 : prev));
        setIsSwapped(false);
        // Peer left temporarily — do NOT end the meeting.
      },
      onConnectionStateChanged: (
        _connection: RtcConnection,
        state: number,
        _reason: number,
      ) => {
        // Only Failed (5) after a successful join is a hard drop.
        // State 1 (Disconnected) fires during initial connect — do NOT leave-room.
        if (state === 5 && hasJoinedOnceRef.current) {
          void handleAgoraDisconnect();
        }
      },
      onError: (err: number) => {
        setStatusMessage(`Call error (${err})`);
        setIsInitializing(false);
        // Token / connection hard failures → leave-room (rejoin), not end.
        if (
          hasJoinedOnceRef.current &&
          (err === 110 || err === 123 || err === 17 || err === 2)
        ) {
          void handleAgoraDisconnect();
        }
      },
    };
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
  }, [remoteLabel, waitingForPatient, handleAgoraDisconnect]);

  const setupVideoSDKEngine = useCallback(async () => {
    try {
      if (!agoraAppId) {
        setStatusMessage('Missing call credentials');
        setIsInitializing(false);
        return false;
      }
      const hasPermission = await getPermission();
      if (!hasPermission) {
        setStatusMessage('Camera and microphone permission required');
        setIsInitializing(false);
        return false;
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      await agoraEngine.initialize({appId: agoraAppId});
      await agoraEngine.enableAudio();
      await agoraEngine.enableVideo();
      agoraEngine.startPreview();
      agoraEngine.setEnableSpeakerphone(true);
      return true;
    } catch (e) {
      setStatusMessage('Failed to initialize call');
      setIsInitializing(false);
      return false;
    }
  }, [agoraAppId]);

  const cleanupAgoraEngine = useCallback(async () => {
    if (isCleaningUpRef.current) {
      return;
    }
    isCleaningUpRef.current = true;
    try {
      const engine = agoraEngineRef.current;
      if (!engine) {
        return;
      }
      if (eventHandler.current) {
        engine.unregisterEventHandler(eventHandler.current);
        eventHandler.current = undefined;
      }
      try {
        engine.stopPreview();
      } catch {
        // ignore
      }
      await engine.leaveChannel();
      engine.release();
      agoraEngineRef.current = undefined;
      setIsJoined(false);
      setRemoteUid(0);
    } catch (e) {
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  // Remote / socket end — leave immediately (no summary popup).
  useEffect(() => {
    if (!lastEndedCall) {
      return;
    }
    intentionalLeaveRef.current = true;
    allowNavigateAwayRef.current = true;
    clearLastEndedCall();
    leaveVideoCallScreen();
    void cleanupAgoraEngine();
  }, [lastEndedCall, clearLastEndedCall, cleanupAgoraEngine]);

  /**
   * Leave call UI without ending the meeting.
   * Navigate home first so Agora teardown never flashes a black crash frame.
   */
  const handleSoftLeave = useCallback(async () => {
    if (softLeavingRef.current) {
      return;
    }
    softLeavingRef.current = true;
    intentionalLeaveRef.current = true;
    allowNavigateAwayRef.current = true;

    if (lastEndedCall) {
      clearLastEndedCall();
      leaveVideoCallScreen();
      void cleanupAgoraEngine();
      return;
    }

    leaveVideoCallScreen();
    try {
      await leaveRoom('vendor_left_ui');
    } catch (e) {
    }
    void cleanupAgoraEngine();
  }, [
    cleanupAgoraEngine,
    lastEndedCall,
    clearLastEndedCall,
    leaveRoom,
  ]);

  useEffect(() => {
    const onBack = () => {
      void handleSoftLeave();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [handleSoftLeave]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', e => {
      if (allowNavigateAwayRef.current) {
        return;
      }
      e.preventDefault();
      void handleSoftLeave();
    });
    return unsub;
  }, [navigation, handleSoftLeave]);

  // Wait for nav transition / IncomingCallActivity teardown before Agora surfaces.
  useEffect(() => {
    let cancelled = false;
    setIsScreenSettled(false);
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }
      // Small delay so native surface / permission dialogs settle on cold start.
      setTimeout(() => {
        if (!cancelled) {
          setIsScreenSettled(true);
        }
      }, Platform.OS === 'android' ? 250 : 0);
    });
    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [callKey]);

  useEffect(() => {
    if (!hasRemoteCallCredentials) {
      setStatusMessage('Preparing call…');
      setIsInitializing(true);
      return undefined;
    }

    if (!isScreenSettled) {
      return undefined;
    }

    // Fresh credentials on this screen = auto-join Agora. Do not block on a
    // stale canRejoin/disconnected from a previous remount / false disconnect.
    intentionalLeaveRef.current = false;
    softLeavingRef.current = false;
    allowNavigateAwayRef.current = false;
    isCleaningUpRef.current = false;
    hasJoinedOnceRef.current = false;
    setDisconnected(false);
    setIsInitializing(true);
    setIsJoined(false);
    setRemoteUid(0);
    setIsSwapped(false);

    let mounted = true;
    const init = async () => {
      const ready = await setupVideoSDKEngine();
      if (!mounted || !ready) {
        return;
      }
      setupEventHandler();
      await joinChannel();
    };
    void init();

    const joinTimeout = setTimeout(() => {
      if (mounted && !hasJoinedOnceRef.current) {
        setStatusMessage('Still connecting… Check your network and try again.');
        setIsInitializing(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(joinTimeout);
      // Only tear down the engine — keep the meeting open on the server.
      // Never call leaveRoom here (remounts were wiping the session → Rejoin).
      void cleanupAgoraEngine();
    };
  }, [
    callKey,
    cleanupAgoraEngine,
    hasRemoteCallCredentials,
    isScreenSettled,
    joinChannel,
    setupEventHandler,
    setupVideoSDKEngine,
  ]);

  const handleEndCall = async () => {
    intentionalLeaveRef.current = true;
    await cleanupAgoraEngine();
    try {
      await endCall();
    } catch (e) {
    }
    allowNavigateAwayRef.current = true;
    clearLastEndedCall();
    leaveVideoCallScreen();
  };

  const confirmEndCall = () => {
    Alert.alert(
      'End Call',
      'Do you want to end this call?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            void handleEndCall();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleRejoin = async () => {
    if (rejoining) {
      return;
    }
    setRejoining(true);
    setStatusMessage('Rejoining…');
    setIsScreenSettled(false);
    try {
      await rejoinCall();
      setDisconnected(false);
      requestAnimationFrame(() => setIsScreenSettled(true));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Rejoin failed',
        text2: error?.message || 'Could not rejoin meeting',
      });
    } finally {
      setRejoining(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    agoraEngineRef.current?.muteLocalAudioStream(next);
    setIsMuted(next);
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    agoraEngineRef.current?.muteLocalVideoStream(next);
    setIsCameraOff(next);
  };

  const toggleSpeaker = () => {
    const next = !isSpeakerOn;
    agoraEngineRef.current?.setEnableSpeakerphone(next);
    setIsSpeakerOn(next);
  };

  const flipCamera = () => {
    agoraEngineRef.current?.switchCamera();
  };

  const toggleSwap = () => {
    if (isJoined && remoteUid !== 0 && !disconnected) {
      setIsSwapped(prev => !prev);
    }
  };
 
  const waitingCopy = waitingForPatient
    ? 'Waiting for patient…'
    : isInitializing
      ? 'Connecting to channel…'
      : isJoined
        ? `Waiting for ${remoteLabel.toLowerCase()}…`
        : statusMessage;

  const displayUid = uid ?? '—';
  const displayChannel = channelName || '…';
  const canSwap = isJoined && remoteUid !== 0 && !disconnected;

  const renderRemoteContent = (isOverlay: boolean) => {
    if (isJoined && remoteUid !== 0 && !disconnected) {
      return (
        <RtcSurfaceView
          key={`remote-${isOverlay ? 'small' : 'big'}`}
          style={styles.fillVideo}
          pointerEvents="none"
          zOrderMediaOverlay={Platform.OS === 'android' && isOverlay}
          canvas={{
            uid: remoteUid,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      );
    }
    
    return (
      <>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>{isVendor ? '👤' : '🩺'}</Text>
        </View>
        <Text style={styles.remoteName}>{remoteLabel}</Text>
        <Text style={styles.waitingText}>{waitingCopy}</Text>
        {(disconnected || canRejoin) && !isInitializing && !isJoined && (
          <TouchableOpacity
            style={styles.rejoinBtn}
            activeOpacity={0.85}
            disabled={rejoining}
            onPress={handleRejoin}>
            {rejoining ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.rejoinText}>Rejoin</Text>
            )}
          </TouchableOpacity>
        )}
      </>
    );
  };

  const renderLocalContent = (isOverlay: boolean) => {
    if (isJoined && !isCameraOff && !disconnected) {
      return (
        <RtcSurfaceView
          key={`local-${isOverlay ? 'small' : 'big'}`}
          style={styles.fillVideo}
          pointerEvents="none"
          zOrderMediaOverlay={Platform.OS === 'android' && isOverlay}
          canvas={{
            uid: 0,
            sourceType: VideoSourceType.VideoSourceCamera,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      );
    }
    return (
      <>
        <View style={styles.localAvatar}>
          <Text style={styles.localEmoji}>{isVendor ? '🩺' : '👤'}</Text>
        </View>
        <Text style={styles.localLabel}>
          {isCameraOff ? 'Camera off' : 'You'}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.remoteVideo}>
        {isSwapped ? renderLocalContent(false) : renderRemoteContent(false)}
        {isInitializing && !disconnected && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        )}
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.leaveBtn}
          activeOpacity={0.85}
          onPress={() => void handleSoftLeave()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={wp(7)}
            color={Colors.white}
          />
          <Text style={styles.leaveBtnText}>Leave</Text>
        </TouchableOpacity>
        <Text style={styles.callTitle}>Health Consultation</Text>
        <Text style={styles.callMeta}>
          {roleLabel} · UID {displayUid}
        </Text>
        <Text style={styles.channelText}>
          {waitingForPatient
            ? 'Status: Waiting for patient'
            : disconnected || canRejoin
              ? 'Meeting still open — rejoin anytime'
              : `Channel: ${displayChannel}`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.localVideo}
        activeOpacity={canSwap ? 0.85 : 1}
        onPress={toggleSwap}>
        {isSwapped ? renderRemoteContent(true) : renderLocalContent(true)}
        {canSwap && (
          <View style={styles.swapBadge} pointerEvents="none">
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={wp(4.5)}
              color={Colors.white}
            />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.controlsBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={toggleMute}>
            <View
              style={[
                styles.controlCircle,
                isMuted && styles.controlCircleActive,
              ]}>
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={wp(5.5)}
                color={Colors.white}
              />
            </View>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={toggleCamera}>
            <View
              style={[
                styles.controlCircle,
                isCameraOff && styles.controlCircleActive,
              ]}>
              <MaterialCommunityIcons
                name={isCameraOff ? 'video-off' : 'video'}
                size={wp(5.5)}
                color={Colors.white}
              />
            </View>
            <Text style={styles.controlLabel}>
              {isCameraOff ? 'Camera on' : 'Camera'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.85}
            onPress={confirmEndCall}>
            <View style={[styles.controlCircle, styles.endCallCircle]}>
              <Image source={Images.callIcon} style={styles.endCallIcon} />
            </View>
            <Text style={[styles.controlLabel, styles.endCallLabel]}>
              End Call
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={toggleSpeaker}>
            <View
              style={[
                styles.controlCircle,
                isSpeakerOn && styles.controlCircleActive,
              ]}>
              <MaterialCommunityIcons
                name={isSpeakerOn ? 'volume-high' : 'volume-off'}
                size={wp(5.5)}
                color={Colors.white}
              />
            </View>
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={flipCamera}>
            <View style={styles.controlCircle}>
              <MaterialCommunityIcons
                name="camera-flip-outline"
                size={wp(5.5)}
                color={Colors.white}
              />
            </View>
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VideoCallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  fillVideo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  avatarEmoji: {
    fontSize: wp(12),
  },
  remoteName: {
    fontSize: FSize.fs20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: hp(0.8),
  },
  waitingText: {
    fontSize: FSize.fs14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: wp(8),
  },
  rejoinBtn: {
    marginTop: hp(2.5),
    backgroundColor: '#22C55E',
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.4),
    borderRadius: wp(3),
    minWidth: wp(32),
    alignItems: 'center',
  },
  rejoinText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FSize.fs15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  topBar: {
    position: 'absolute',
    top: hp(6),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: wp(5),
    zIndex: 2,
  },
  leaveBtn: {
    position: 'absolute',
    left: wp(3),
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(2),
    borderRadius: wp(2),
    zIndex: 3,
  },
  leaveBtnText: {
    color: Colors.white,
    fontSize: FSize.fs13,
    fontWeight: '600',
    marginRight: wp(1),
  },
  callTitle: {
    fontSize: FSize.fs16,
    fontWeight: '700',
    color: Colors.white,
  },
  callMeta: {
    fontSize: FSize.fs13,
    color: '#CBD5E1',
    marginTop: hp(0.4),
  },
  channelText: {
    fontSize: FSize.fs11,
    color: '#64748B',
    marginTop: hp(0.3),
  },
  localVideo: {
    position: 'absolute',
    top: hp(16),
    right: wp(4),
    width: wp(28),
    height: hp(18),
    borderRadius: wp(2.5),
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  swapBadge: {
    position: 'absolute',
    top: wp(1.5),
    left: wp(1.5),
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localAvatar: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localEmoji: {
    fontSize: wp(6),
  },
  localLabel: {
    fontSize: FSize.fs11,
    color: '#E2E8F0',
    marginTop: hp(0.8),
    fontWeight: '600',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: hp(4),
    paddingTop: hp(2),
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    zIndex: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: wp(2),
  },
  controlButton: {
    alignItems: 'center',
    minWidth: wp(14),
  },
  controlCircle: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.6),
  },
  controlCircleActive: {
    backgroundColor: '#475569',
  },
  controlLabel: {
    fontSize: FSize.fs10,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  endCallCircle: {
    backgroundColor: '#DC2626',
  },
  endCallIcon: {
    width: wp(6),
    height: wp(6),
    tintColor: Colors.white,
    transform: [{rotate: '135deg'}],
  },
  endCallLabel: {
    color: '#FCA5A5',
    fontWeight: '600',
  },
});
