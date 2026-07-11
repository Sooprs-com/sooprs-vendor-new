import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {useVendorCall} from '../context/VendorCallContext';
import {navigateToVideoCall} from '../router/navigationRef';
import {stopIncomingRingtone} from '../services/incomingRingtone';
import Colors from '../assets/commonCSS/Colors';
import FSize from '../assets/commonCSS/FSize';
import {hp, wp} from '../assets/commonCSS/GlobalCSS';

export default function IncomingCallModal() {
  const {incomingCall, acceptCall, rejectCall} = useVendorCall();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const visible = !!incomingCall;

  const onAccept = async () => {
    if (loading) {
      return;
    }
    setLoading('accept');
    Vibration.cancel();
    stopIncomingRingtone();
    try {
      const agoraData = await acceptCall();
      if (agoraData) {
        navigateToVideoCall({
          channelName: agoraData.channelName,
          token: agoraData.token,
          appId: agoraData.appId,
          uid: agoraData.uid,
          appointmentId: agoraData.appointmentId,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Call failed',
        text2: error?.message || 'Could not accept call',
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
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onReject}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="video"
              size={wp(10)}
              color={Colors.white}
            />
          </View>

          <Text style={styles.title}>Incoming Consultation</Text>
          <Text style={styles.subtitle}>
            {incomingCall.patientName
              ? incomingCall.patientName
              : `Appointment #${incomingCall.appointmentId}`}
          </Text>
          <Text style={styles.hint}>Patient is waiting for you</Text>

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
                  <Text style={styles.btnText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              activeOpacity={0.85}
              disabled={!!loading}
              onPress={onAccept}>
              {loading === 'accept' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="phone"
                    size={wp(6)}
                    color={Colors.white}
                  />
                  <Text style={styles.btnText}>
                    {incomingCall.acceptButtonLabel || 'Accept'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: wp(5),
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconCircle: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
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
