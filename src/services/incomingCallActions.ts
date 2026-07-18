import {healthVideoApi} from './healthVideoApi';
import {AgoraCallData, IncomingCallData, toAgoraCallData} from '../types/vendorCall';

export async function acceptIncomingCallFromPush(
  token: string,
  callData: IncomingCallData,
): Promise<AgoraCallData> {
  const res = await healthVideoApi.acceptCall(token, callData.appointmentId);
  const raw = (res.data || res) as Record<string, any>;
  const agoraData = toAgoraCallData(raw);
  if (!agoraData) {
    throw new Error('Invalid call credentials received from server');
  }
  return agoraData;
}

export async function rejectIncomingCallFromPush(
  token: string,
  callData: IncomingCallData,
  reason = 'declined_by_vendor',
): Promise<void> {
  await healthVideoApi.rejectCall(token, reason, callData.appointmentId);
}
