import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {Platform, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {FullWindowOverlay} from 'react-native-screens';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  RenderModeType,
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
} from 'react-native-agora';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';
import {useVendorCall} from '../../context/VendorCallContext';
import {navigationRef} from '../../router/navigationRef';
import {useCallMedia} from './CallMediaContext';

const BUBBLE_W = wp(28);
const BUBBLE_H = hp(18);
const BUBBLE_EDGE = wp(2);

type VideoCanvas = {
  uid: number;
  sourceType?: VideoSourceType;
  renderMode: RenderModeType;
};

function AgoraVideo({viewKey, canvas}: {viewKey: string; canvas: VideoCanvas}) {
  if (Platform.OS === 'android') {
    return (
      <RtcTextureView
        key={viewKey}
        style={styles.fill}
        pointerEvents="none"
        canvas={canvas}
      />
    );
  }
  return (
    <RtcSurfaceView
      key={viewKey}
      style={styles.fill}
      pointerEvents="none"
      canvas={canvas}
    />
  );
}

function SelfPreview({
  isPreviewReady,
  isCameraOff,
}: {
  isPreviewReady: boolean;
  isCameraOff: boolean;
}) {
  const showCamera = isPreviewReady && !isCameraOff;
  return (
    <View style={styles.selfPip} pointerEvents="none">
      {showCamera ? (
        <AgoraVideo
          viewKey="bubble-self"
          canvas={{
            uid: 0,
            sourceType: VideoSourceType.VideoSourceCamera,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
      ) : (
        <View style={styles.selfPipPlaceholder}>
          <MaterialCommunityIcons
            name={isCameraOff ? 'video-off' : 'account'}
            size={wp(4)}
            color="#E2E8F0"
          />
        </View>
      )}
    </View>
  );
}

function BubbleVideo({
  remoteUid,
  isPreviewReady,
  isCameraOff,
  remoteLabel,
}: {
  remoteUid: number;
  isPreviewReady: boolean;
  isCameraOff: boolean;
  remoteLabel: string;
}) {
  if (remoteUid !== 0) {
    return (
      <View style={styles.fill} pointerEvents="none">
        <AgoraVideo
          viewKey={`bubble-remote-${remoteUid}`}
          canvas={{
            uid: remoteUid,
            renderMode: RenderModeType.RenderModeHidden,
          }}
        />
        <SelfPreview
          isPreviewReady={isPreviewReady}
          isCameraOff={isCameraOff}
        />
      </View>
    );
  }

  if (isPreviewReady && !isCameraOff) {
    return (
      <AgoraVideo
        viewKey="bubble-local"
        canvas={{
          uid: 0,
          sourceType: VideoSourceType.VideoSourceCamera,
          renderMode: RenderModeType.RenderModeHidden,
        }}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>🎥</Text>
      <Text style={styles.placeholderText} numberOfLines={2}>
        {remoteLabel}
      </Text>
    </View>
  );
}

export default function MinimizedCallBubble() {
  const insets = useSafeAreaInsets();
  const {width: screenW, height: screenH} = useWindowDimensions();
  const {mode, snapshot, api} = useCallMedia();
  const {activeCall, canRejoin, lastEndedCall, clearLastEndedCall} = useVendorCall();
  const bubbleX = useSharedValue(screenW - BUBBLE_W - wp(3));
  const bubbleY = useSharedValue(
    screenH - BUBBLE_H - insets.bottom - hp(11),
  );
  const dragOriginX = useSharedValue(0);
  const dragOriginY = useSharedValue(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    if (mode !== 'bubble') {
      return;
    }
    if (lastEndedCall || (!activeCall && !canRejoin)) {
      if (lastEndedCall) {
        clearLastEndedCall();
      }
      void api.releaseEngine();
    }
  }, [activeCall, api, canRejoin, clearLastEndedCall, lastEndedCall, mode]);

  const onExpand = useCallback(() => {
    const route = api.getReturnRoute();
    api.prepareExpand();
    const params = route?.params ?? {};
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!navigationRef.isReady()) {
          return;
        }
        navigationRef.navigate('Authentication', {
          screen: 'VideoCallScreen',
          params,
        });
      });
    });
  }, [api]);

  const markDragged = useCallback(() => {
    draggedRef.current = true;
  }, []);

  useEffect(() => {
    const maxX = Math.max(BUBBLE_EDGE, screenW - BUBBLE_W - BUBBLE_EDGE);
    const maxY = Math.max(BUBBLE_EDGE, screenH - BUBBLE_H - BUBBLE_EDGE);
    if (!draggedRef.current) {
      bubbleX.value = Math.min(
        maxX,
        Math.max(BUBBLE_EDGE, screenW - BUBBLE_W - wp(3)),
      );
      bubbleY.value = Math.min(
        maxY,
        Math.max(
          BUBBLE_EDGE,
          screenH - BUBBLE_H - insets.bottom - hp(11),
        ),
      );
      return;
    }
    bubbleX.value = Math.min(Math.max(bubbleX.value, BUBBLE_EDGE), maxX);
    bubbleY.value = Math.min(Math.max(bubbleY.value, BUBBLE_EDGE), maxY);
  }, [bubbleX, bubbleY, insets.bottom, screenH, screenW]);

  const bubbleGesture = useMemo(() => {
    const maxX = Math.max(BUBBLE_EDGE, screenW - BUBBLE_W - BUBBLE_EDGE);
    const maxY = Math.max(BUBBLE_EDGE, screenH - BUBBLE_H - BUBBLE_EDGE);
    const pan = Gesture.Pan()
      .minDistance(14)
      .onStart(() => {
        dragOriginX.value = bubbleX.value;
        dragOriginY.value = bubbleY.value;
        runOnJS(markDragged)();
      })
      .onUpdate(event => {
        bubbleX.value = Math.min(
          maxX,
          Math.max(BUBBLE_EDGE, dragOriginX.value + event.translationX),
        );
        bubbleY.value = Math.min(
          maxY,
          Math.max(BUBBLE_EDGE, dragOriginY.value + event.translationY),
        );
      });
    const tap = Gesture.Tap()
      .maxDuration(400)
      .maxDistance(14)
      .onEnd((_event, success) => {
        if (success) {
          runOnJS(onExpand)();
        }
      });
    return Gesture.Exclusive(pan, tap);
  }, [
    bubbleX,
    bubbleY,
    dragOriginX,
    dragOriginY,
    markDragged,
    onExpand,
    screenH,
    screenW,
  ]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{translateX: bubbleX.value}, {translateY: bubbleY.value}],
  }));

  if (mode !== 'bubble') {
    return null;
  }

  const bubble = (
    <View pointerEvents="box-none" style={styles.overlay}>
      <GestureDetector gesture={bubbleGesture}>
        <Animated.View
          collapsable={false}
          accessibilityRole="button"
          accessibilityLabel="Video call. Drag to move, tap to return."
          style={[styles.bubble, bubbleStyle]}>
          <BubbleVideo
            remoteUid={snapshot.remoteUid}
            isPreviewReady={snapshot.isPreviewReady}
            isCameraOff={snapshot.isCameraOff}
            remoteLabel={snapshot.remoteLabel}
          />
          <View style={styles.hitTarget} />
          <View style={styles.badge} pointerEvents="none">
            <MaterialCommunityIcons name="arrow-expand" size={wp(3.6)} color="#fff" />
          </View>
          {snapshot.isMuted ? (
            <View style={styles.muteBadge} pointerEvents="none">
              <MaterialCommunityIcons
                name="microphone-off"
                size={wp(3.4)}
                color="#fff"
              />
            </View>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <GestureHandlerRootView pointerEvents="box-none" style={styles.overlay}>
          {bubble}
        </GestureHandlerRootView>
      </FullWindowOverlay>
    );
  }
  return bubble;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BUBBLE_W,
    height: BUBBLE_H,
    borderRadius: wp(3),
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  selfPip: {
    position: 'absolute',
    right: wp(1.2),
    bottom: wp(1.2),
    width: wp(10),
    height: hp(6.6),
    borderRadius: wp(1.4),
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    zIndex: 2,
    elevation: 4,
  },
  selfPipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  hitTarget: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
    backgroundColor: '#1E293B',
  },
  placeholderEmoji: {
    fontSize: wp(6),
  },
  placeholderText: {
    marginTop: hp(0.4),
    color: '#E2E8F0',
    fontSize: wp(2.8),
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: wp(1.4),
    right: wp(1.4),
    zIndex: 3,
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBadge: {
    position: 'absolute',
    left: wp(1.4),
    bottom: wp(1.4),
    zIndex: 3,
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
