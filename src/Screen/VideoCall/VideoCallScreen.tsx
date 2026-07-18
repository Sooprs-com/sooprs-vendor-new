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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useRoute} from '@react-navigation/native';
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
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import Colors from '../../assets/commonCSS/Colors';
import Images from '../../assets/image';
import FSize from '../../assets/commonCSS/FSize';
import {
  AGORA_APP_ID,
  AGORA_CHANNEL_NAME,
  AGORA_TOKEN,
} from './agoraConfig';
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
};

const getPermission = async () => {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
  }
};

const VideoCallScreen = () => {
  const route = useRoute();
  const params = (route.params || {}) as VideoCallRouteParams;
  const {endCall} = useVendorCall();

  const role = params.role ?? 'vendor';
  const channelName = params.channelName ?? AGORA_CHANNEL_NAME;
  const agoraToken = params.token ?? AGORA_TOKEN;
  const agoraAppId = params.appId ?? AGORA_APP_ID;
  const uid = params.uid ?? 2;
  const hasRemoteCallCredentials = Boolean(
    params.channelName && params.token && params.appId && params.uid != null,
  );
  const callKey =
    params.callKey ??
    `${params.appointmentId ?? channelName}-${String(agoraToken || '').slice(0, 8)}`;

  const isVendor = role === 'vendor';
  const roleLabel = isVendor ? 'Vendor (Doctor)' : 'User (Patient)';
  const remoteLabel = isVendor ? 'Patient' : 'Doctor';

  const agoraEngineRef = useRef<IRtcEngine>();
  const eventHandler = useRef<IRtcEngineEventHandler>();

  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connecting…');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  const joinChannel = useCallback(async () => {
    try {
      await agoraEngineRef.current?.joinChannel(
        agoraToken,
        channelName,
        uid,
        {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        },
      );
    } catch (e) {
      console.error('joinChannel error:', e);
      setStatusMessage('Failed to join channel');
    }
  }, [agoraToken, channelName, uid]);

  const setupEventHandler = useCallback(() => {
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        setStatusMessage('Connected');
        setIsJoined(true);
        setIsInitializing(false);
      },
      onUserJoined: (_connection: RtcConnection, remoteUserUid: number) => {
        setStatusMessage(`${remoteLabel} joined`);
        setRemoteUid(remoteUserUid);
      },
      onUserOffline: (_connection: RtcConnection, remoteUserUid: number) => {
        setStatusMessage(`${remoteLabel} left`);
        setRemoteUid(prev => (prev === remoteUserUid ? 0 : prev));
      },
      onError: (err: number) => {
        console.error('Agora error:', err);
        setStatusMessage(`Call error (${err})`);
        setIsInitializing(false);
      },
    };
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
  }, [remoteLabel]);

  const setupVideoSDKEngine = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      await agoraEngine.initialize({appId: agoraAppId});
      await agoraEngine.enableAudio();
      await agoraEngine.enableVideo();
      agoraEngine.startPreview();
      agoraEngine.setEnableSpeakerphone(true);
    } catch (e) {
      console.error('Agora init error:', e);
      setStatusMessage('Failed to initialize call');
      setIsInitializing(false);
    }
  }, [agoraAppId]);

  const cleanupAgoraEngine = useCallback(() => {
    try {
      if (eventHandler.current) {
        agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
      }
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
      agoraEngineRef.current = undefined;
    } catch (e) {
      console.error('Agora cleanup error:', e);
    }
  }, []);

  useEffect(() => {
    if (!hasRemoteCallCredentials) {
      setStatusMessage('Preparing call…');
      setIsInitializing(true);
      return;
    }

    const init = async () => {
      await setupVideoSDKEngine();
      setupEventHandler();
      await joinChannel();
    };
    init();
    return () => {
      cleanupAgoraEngine();
    };
  },
  
   [
    callKey,
    cleanupAgoraEngine,
    hasRemoteCallCredentials,
    joinChannel,
    setupEventHandler,
    setupVideoSDKEngine,
  ]);

  const handleEndCall = async () => {
    cleanupAgoraEngine();
    try {
      await endCall();
    } catch (e) {
      console.warn('endCall API failed:', e);
    }
    leaveVideoCallScreen();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.remoteVideo}>
        {isJoined && remoteUid !== 0 ? (
          <RtcSurfaceView
            style={styles.remoteRtcView}
            canvas={{
              uid: remoteUid,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        ) : (
          <>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>{isVendor ? '👤' : '🩺'}</Text>
            </View>
            <Text style={styles.remoteName}>{remoteLabel}</Text>
            <Text style={styles.waitingText}>
              {isInitializing
                ? 'Connecting to channel…'
                : isJoined
                  ? `Waiting for ${remoteLabel.toLowerCase()}…`
                  : statusMessage}
            </Text>
          </>
        )}
        {isInitializing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        )}
      </View>

      <View style={styles.topBar}>
        <Text style={styles.callTitle}>Health Consultation</Text>
        <Text style={styles.callMeta}>
          {roleLabel} · UID {uid}
        </Text>
        <Text style={styles.channelText}>Channel: {channelName}</Text>
      </View>

      <View style={styles.localVideo}>
        {isJoined && !isCameraOff ? (
          <RtcSurfaceView
            style={styles.localRtcView}
            zOrderMediaOverlay={Platform.OS === 'android'}
            canvas={{
              uid: 0,
              sourceType: VideoSourceType.VideoSourceCamera,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        ) : (
          <>
            <View style={styles.localAvatar}>
              <Text style={styles.localEmoji}>{isVendor ? '🩺' : '👤'}</Text>
            </View>
            <Text style={styles.localLabel}>
              {isCameraOff ? 'Camera off' : 'You'}
            </Text>
          </>
        )}
      </View>

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
            onPress={handleEndCall}>
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
  remoteRtcView: {
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
  localRtcView: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
