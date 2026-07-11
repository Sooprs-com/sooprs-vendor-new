export type IncomingCallData = {
  appointmentId: number;
  callSessionId?: string;
  channelName?: string;
  token?: string;
  appId?: string;
  uid?: number;
  participantRole?: string;
  acceptButtonLabel?: string;
  playRingtone?: boolean;
  patientName?: string;
  fromPush?: boolean;
  [key: string]: any;
};

export type AgoraCallData = {
  appointmentId: number;
  callSessionId?: string;
  token: string;
  channelName: string;
  appId: string;
  uid: number;
  [key: string]: any;
};

export function toAgoraCallData(payload: Record<string, any>): AgoraCallData | null {
  const appointmentId = Number(payload?.appointmentId);
  const token = payload?.token;
  const channelName = payload?.channelName;
  const appId = payload?.appId;
  const uid = Number(payload?.uid);

  if (!appointmentId || !token || !channelName || !appId || !uid) {
    return null;
  }

  return {
    appointmentId,
    callSessionId: payload?.callSessionId,
    token,
    channelName,
    appId,
    uid,
    ...payload,
  };
}

export type CallNotification = {
  title?: string;
  message?: string;
  type?: string;
  appointmentId?: number | null;
  [key: string]: any;
};
