import {NativeModules, Platform} from 'react-native';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import {IncomingCallData} from '../types/vendorCall';

// v2 forces a fresh HIGH-importance channel if an older channel was created
// with lower importance (Android never upgrades existing channel importance).
const CHANNEL_ID = 'com.sooprsvendor.incomingcall.v2';
const MAIN_COMPONENT = 'VendorIncomingCallScreen';

type IncomingCallAlertNative = {
  launchFullScreenIfLocked?: (
    uuid: string,
    title: string,
    body: string,
    acceptLabel: string,
    rejectLabel: string,
    ttlSeconds: number,
    payloadJson: string,
  ) => void;
};

const IncomingCallAlert =
  NativeModules.IncomingCallAlert as IncomingCallAlertNative | undefined;

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

  const uuid = String(
    callData.pushUuid || callData.callSessionId || callData.appointmentId,
  );
  const timeoutMs = (callData.ttlSeconds || 30) * 1000;
  const title = callData.patientName || 'Incoming Consultation';
  const body = callData.isPeerWaiting
    ? 'Patient is waiting — Join now'
    : 'Window is open — Join the consultation';
  const acceptLabel =
    callData.acceptButtonLabel ||
    (callData.isPeerWaiting ? 'Join now' : 'Join');
  const rejectLabel = callData.rejectButtonLabel || 'Reject';
  const ttlSeconds = callData.ttlSeconds || 30;

  RNNotificationCall.displayNotification(uuid, null, timeoutMs, {
    channelId: CHANNEL_ID,
    channelName: 'Health Consultation Calls',
    notificationIcon: 'ic_launcher',
    notificationTitle: title,
    notificationBody: body,
    answerText: acceptLabel,
    declineText: rejectLabel,
    notificationSound: 'incoming_ring',
    isVideo: true,
    mainComponent: MAIN_COMPONENT,
    payload: callData,
  });

  // FSI notification alone can fail on some OEMs / when FSI permission is off.
  // Also try to open the full-screen Accept UI while screen is locked/off.
  try {
    IncomingCallAlert?.launchFullScreenIfLocked?.(
      uuid,
      title,
      body,
      acceptLabel,
      rejectLabel,
      ttlSeconds,
      JSON.stringify(callData),
    );
  } catch {
    // Native module optional until rebuild
  }
}

export function launchMainAppFromIncomingCall() {
  if (Platform.OS !== 'android') {
    return;
  }
  RNNotificationCall.backToApp();
}

export {RNNotificationCall, MAIN_COMPONENT};
