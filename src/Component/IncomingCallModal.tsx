import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Platform,
  NativeModules,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {useVendorCall} from '../context/VendorCallContext';
import {stopIncomingRingtone} from '../services/incomingRingtone';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';

function stopNativeRingtone() {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    NativeModules.IncomingCallAlert?.stopRingtoneService?.();
  } catch {
    // optional until rebuild
  }
}

export default function IncomingCallModal() {
  const {incomingCall, joinCall, rejectCall} = useVendorCall();
  const [loading, setLoading] = useState<'join' | 'reject' | null>(null);

  const visible = !!incomingCall;
  const isPeerWaiting = !!incomingCall?.isPeerWaiting;
  const joinLabel =
    incomingCall?.acceptButtonLabel || (isPeerWaiting ? 'Join now' : 'Join');

  const onJoin = async () => {
    if (loading) {
      return;
    }
    setLoading('join');
    Vibration.cancel();
    stopIncomingRingtone();
    stopNativeRingtone();
    try {
      await joinCall();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Join failed',
        text2: error?.message || 'Could not join call',
      });
    } finally {
      setLoading(null);
    }
  };

  const onReject = async () => {
    if (loading) {
      return;
    }
    setLoading('reject');
    Vibration.cancel();
    stopIncomingRingtone();
    stopNativeRingtone();
    try {
      await rejectCall('busy');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reject failed',
        text2: error?.message || 'Could not reject call',
      });
    } finally {
      setLoading(null);
    }
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onReject}>
      <View style={styles.container}>
        <View
          style={[
            styles.iconCircle,
            isPeerWaiting && styles.iconCircleWaiting,
          ]}>
          <MaterialCommunityIcons
            name={isPeerWaiting ? 'account-clock' : 'video'}
            size={wp(12)}
            color={Colors.white}
          />
        </View>

        <Text style={styles.title}>
          {isPeerWaiting
            ? 'Patient is waiting — Join now'
            : 'Incoming Consultation'}
        </Text>
        <Text style={styles.subtitle}>
          {incomingCall.patientName
            ? incomingCall.patientName
            : `Appointment #${incomingCall.appointmentId}`}
        </Text>
        <Text style={styles.hint}>
          {isPeerWaiting
            ? 'Tap Join now to start the video consultation'
            : 'Window is open — Join to enter the meeting'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            activeOpacity={0.85}
            disabled={!!loading}
            onPress={onReject}>
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
                  {incomingCall.rejectButtonLabel || 'Reject'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.joinBtn]}
            activeOpacity={0.85}
            disabled={!!loading}
            onPress={onJoin}>
            {loading === 'join' ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="video"
                  size={wp(6)}
                  color={Colors.white}
                />
                <Text style={styles.btnText}>{joinLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  iconCircleWaiting: {
    backgroundColor: '#D97706',
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
  joinBtn: {
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
