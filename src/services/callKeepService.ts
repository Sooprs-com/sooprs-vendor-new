import {Platform} from 'react-native';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import {IncomingCallData} from '../types/vendorCall';

const CHANNEL_ID = 'com.sooprsvendor.incomingcall';
const MAIN_COMPONENT = 'VendorIncomingCallScreen';

export function hideIncomingCallNotification() {
  if (Platform.OS !== 'android') {
    return;
  }
  RNNotificationCall.hideNotification();
}

export function showBackgroundIncomingCall(callData: IncomingCallData) {
  if (Platform.OS !== 'android') {
    return;
  }

  const uuid = String(callData.pushUuid || callData.callSessionId || callData.appointmentId);
  const timeoutMs = (callData.ttlSeconds || 30) * 1000;

  RNNotificationCall.displayNotification(uuid, null, timeoutMs, {
    channelId: CHANNEL_ID,
    channelName: 'Health Consultation Calls',
    notificationIcon: 'ic_launcher',
    notificationTitle: callData.patientName || 'Incoming Consultation',
    notificationBody: 'Patient is waiting for you',
    answerText: callData.acceptButtonLabel || 'Accept',
    declineText: callData.rejectButtonLabel || 'Reject',
    notificationSound: 'incoming_ring',
    isVideo: true,
    mainComponent: MAIN_COMPONENT,
    payload: callData,
  });
}

export function launchMainAppFromIncomingCall() {
  if (Platform.OS !== 'android') {
    return;
  }
  RNNotificationCall.backToApp();
}

export {RNNotificationCall, MAIN_COMPONENT};
