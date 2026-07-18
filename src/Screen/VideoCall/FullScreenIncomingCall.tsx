import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  NativeModules,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  hideIncomingCallNotification,
} from '../../services/callKeepService';
import {
  savePendingCallAction,
} from '../../services/pendingCallAction';
import {markCallLaunchGuard} from '../../services/callLaunchGuard';
import {IncomingCallData} from '../../types/vendorCall';
import {stopIncomingRingtone} from '../../services/incomingRingtone';
import Colors from '../../assets/commonCSS/Colors';
import FSize from '../../assets/commonCSS/FSize';
import {hp, wp} from '../../assets/commonCSS/GlobalCSS';

type Props = {
  uuid?: string;
  name?: string;
  payload?: IncomingCallData | string;
};

function stopNativeRingtoneService() {
  if (Platform.OS === 'android') {
    try {
      NativeModules.IncomingCallAlert?.stopRingtoneService?.();
    } catch {
      // Native module optional until rebuild
    }
  }
}

function parsePayload(payload: Props['payload']): IncomingCallData | null {
  if (!payload) {
    return null;
  }
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as IncomingCallData;
    } catch {
      return null;
    }
  }
  return payload;
}

export default function FullScreenIncomingCall(props: Props) {
  const callData = useMemo(() => parsePayload(props.payload), [props.payload]);
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  useEffect(() => {
    return () => {
      stopIncomingRingtone();
    };
  }, []);

  const handleAnswer = async () => {
    if (!callData || loading) {
      return;
    }
    setLoading('accept');
    stopIncomingRingtone();
    stopNativeRingtoneService();

    await savePendingCallAction({
      action: 'accept',
      savedAt: Date.now(),
      data: callData,
    });
    await markCallLaunchGuard(callData.appointmentId);

    hideIncomingCallNotification();

    if (Platform.OS === 'android' && NativeModules.IncomingCallAlert?.launchMainApp) {
      NativeModules.IncomingCallAlert.launchMainApp();
    }
  };

  const handleDecline = async () => {
    if (!callData || loading) {
      return;
    }
    setLoading('reject');
    stopIncomingRingtone();
    stopNativeRingtoneService();

    await savePendingCallAction({
      action: 'reject',
      savedAt: Date.now(),
      data: callData,
    });
    await markCallLaunchGuard(callData.appointmentId);

    hideIncomingCallNotification();

    if (Platform.OS === 'android' && NativeModules.IncomingCallAlert?.launchMainApp) {
      NativeModules.IncomingCallAlert.launchMainApp();
    }
  };

  if (!callData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Incoming Consultation</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="video" size={wp(12)} color={Colors.white} />
      </View>

      <Text style={styles.title}>Incoming Consultation</Text>
      <Text style={styles.subtitle}>
        {callData.patientName || props.name || `Appointment #${callData.appointmentId}`}
      </Text>
      <Text style={styles.hint}>Patient is waiting for you</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          disabled={!!loading}
          onPress={handleDecline}>
          {loading === 'reject' ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="phone-hangup"
                size={wp(6)}
                color={Colors.white}
              />
              <Text style={styles.btnText}>
                {callData.rejectButtonLabel || 'Reject'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          disabled={!!loading}
          onPress={handleAnswer}>
          {loading === 'accept' ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="phone" size={wp(6)} color={Colors.white} />
              <Text style={styles.btnText}>
                {callData.acceptButtonLabel || 'Accept'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  iconCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: FSize.fs22,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FSize.fs16,
    color: '#94A3B8',
    marginTop: hp(1),
    textAlign: 'center',
  },
  hint: {
    fontSize: FSize.fs13,
    color: '#64748B',
    marginTop: hp(0.8),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: hp(4),
    gap: wp(6),
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(28),
    paddingVertical: hp(2),
    borderRadius: wp(4),
    gap: hp(0.8),
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FSize.fs14,
  },
});
