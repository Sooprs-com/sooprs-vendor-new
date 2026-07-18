import {IncomingCallData} from '../types/vendorCall';

const INCOMING_EVENTS = new Set(['incoming-call', 'incoming_call']);
const INCOMING_CATEGORY = 'HEALTH_INCOMING_CALL';
const INCOMING_UI_ACTION = 'show_incoming_ring';

function parsePayloadJson(raw: unknown): Record<string, any> | null {
  if (!raw) {
    return null;
  }
  if (typeof raw === 'object') {
    return raw as Record<string, any>;
  }
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isIncomingCallForRole(
  participantRole: string | undefined,
  isVendor = true,
): boolean {
  const expectedRole = isVendor ? 'receiver' : 'caller';
  if (!participantRole) {
    return isVendor;
  }
  return participantRole === expectedRole;
}

export function isIncomingCallPush(data: Record<string, any> | null | undefined): boolean {
  if (!data) {
    return false;
  }

  const event = String(data.event || data.type || '').toLowerCase();
  const category = String(data.notificationCategory || '').toUpperCase();
  const uiAction = String(data.uiAction || '').toLowerCase();

  if (INCOMING_EVENTS.has(event)) {
    return true;
  }
  if (category === INCOMING_CATEGORY) {
    return true;
  }
  if (uiAction === INCOMING_UI_ACTION) {
    return true;
  }

  return false;
}

export function parseIncomingCallPush(
  data: Record<string, any>,
): IncomingCallData | null {
  const nested = parsePayloadJson(data.payloadJson);
  const merged = {...(nested || {}), ...data};
  const appointmentId = Number(merged.appointmentId);

  if (!appointmentId) {
    return null;
  }

  if (!isIncomingCallForRole(merged.participantRole, true)) {
    return null;
  }

  return {
    appointmentId,
    callSessionId: merged.callSessionId,
    channelName: merged.channelName,
    token: merged.token,
    appId: merged.appId,
    uid: merged.uid ? Number(merged.uid) : undefined,
    participantRole: merged.participantRole || 'receiver',
    acceptButtonLabel: merged.acceptButtonLabel || 'Accept',
    rejectButtonLabel: merged.rejectButtonLabel || 'Reject',
    onAcceptAction: merged.onAcceptAction || 'accept',
    onRejectAction: merged.onRejectAction || 'call_reject_api',
    playRingtone: merged.playRingtone !== 'false' && merged.playRingtone !== false,
    patientName: merged.title || merged.patientName || merged.callerName,
    ttlSeconds: merged.ttlSeconds ? Number(merged.ttlSeconds) : 30,
    fromPush: true,
    pushUuid:
      merged.callSessionId ||
      merged.callUUID ||
      `vendor-call-${appointmentId}`,
  };
}
