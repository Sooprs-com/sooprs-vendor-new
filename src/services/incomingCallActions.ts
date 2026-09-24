import {healthVideoApi} from './healthVideoApi';
import {AgoraCallData, IncomingCallData, toAgoraCallData} from '../types/vendorCall';

/**
 * Primary path: POST /call/join-room
 * (Do not build new UI on /call/accept.)
 */
export async function joinIncomingCallFromPush(
  token: string,
  callData: IncomingCallData,
): Promise<AgoraCallData> {
  const res = await healthVideoApi.joinRoom(token, callData.appointmentId);
  const raw = (res.data || res) as Record<string, any>;
  const agoraData = toAgoraCallData({
    appointmentId: callData.appointmentId,
    ...raw,
  });
  if (!agoraData) {
    throw new Error('Invalid call credentials received from server');
  }
  return agoraData;
}

/** @deprecated Use joinIncomingCallFromPush — kept for naming compat */
export async function acceptIncomingCallFromPush(
  token: string,
  callData: IncomingCallData,
): Promise<AgoraCallData> {
  return joinIncomingCallFromPush(token, callData);
}

export async function rejectIncomingCallFromPush(
  token: string,
  callData: IncomingCallData,
  reason = 'declined_by_vendor',
): Promise<void> {
  await healthVideoApi.rejectCall(token, reason, callData.appointmentId);
}
