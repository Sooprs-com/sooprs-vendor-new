import {IncomingCallData} from '../types/vendorCall';

const INCOMING_EVENTS = new Set(['incoming-call', 'incoming_call']);
const PEER_WAITING_EVENTS = new Set(['peer-waiting', 'peer_waiting']);
const INCOMING_CATEGORY = 'HEALTH_INCOMING_CALL';
const PEER_WAITING_CATEGORY = 'HEALTH_PEER_WAITING';
const INCOMING_UI_ACTION = 'show_incoming_ring';
const PEER_WAITING_UI_ACTION = 'show_peer_waiting_join';

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

function isPeerWaitingPayload(data: Record<string, any>): boolean {
  const event = String(data.event || data.type || '').toLowerCase();
  const category = String(data.notificationCategory || '').toUpperCase();
  const uiAction = String(data.uiAction || '').toLowerCase();

  if (PEER_WAITING_EVENTS.has(event)) {
    return true;
  }
  if (category === PEER_WAITING_CATEGORY) {
    return true;
  }
  if (uiAction === PEER_WAITING_UI_ACTION) {
    return true;
  }
  return false;
}

export function isIncomingCallPush(data: Record<string, any> | null | undefined): boolean {
  if (!data) {
    return false;
  }

  if (isPeerWaitingPayload(data)) {
    return true;
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

export function isSoftMissNotification(
  data: Record<string, any> | null | undefined,
): boolean {
  if (!data) {
    return false;
  }
  return (
    data.softMiss === true ||
    data.softMiss === 'true' ||
    data?.data?.softMiss === true
  );
}

export function parseIncomingCallPush(
  data: Record<string, any>,
): IncomingCallData | null {
  const nested = parsePayloadJson(data.payloadJson);
  const actionsJoin = data?.actions?.join?.body || nested?.actions?.join?.body;
  const merged = {...(nested || {}), ...data, ...(actionsJoin || {})};
  const appointmentId = Number(
    merged.appointmentId || actionsJoin?.appointmentId,
  );

  if (!appointmentId) {
    return null;
  }

  if (!isIncomingCallForRole(merged.participantRole, true)) {
    return null;
  }

  const peerWaiting = isPeerWaitingPayload(merged) || isPeerWaitingPayload(data);

  return {
    appointmentId,
    callSessionId: merged.callSessionId,
    channelName: merged.channelName,
    token: merged.token,
    appId: merged.appId,
    uid: merged.uid ? Number(merged.uid) : undefined,
    participantRole: merged.participantRole || 'receiver',
    // New flow: primary CTA is Join (not Accept-only)
    acceptButtonLabel:
      merged.acceptButtonLabel || (peerWaiting ? 'Join now' : 'Join'),
    rejectButtonLabel: merged.rejectButtonLabel || 'Reject',
    onAcceptAction: merged.onAcceptAction || 'join_room',
    onRejectAction: merged.onRejectAction || 'call_reject_api',
    playRingtone: merged.playRingtone !== 'false' && merged.playRingtone !== false,
    patientName: merged.title || merged.patientName || merged.callerName,
    // Soft miss is a reminder only — do not permanently close the call UI.
    ttlSeconds: merged.ttlSeconds ? Number(merged.ttlSeconds) : 60,
    fromPush: true,
    uiAction: merged.uiAction,
    isPeerWaiting: peerWaiting,
    softMiss: isSoftMissNotification(merged),
    meetingStillOpen:
      merged.meetingStillOpen === true || merged.meetingStillOpen === 'true',
    status: merged.status,
    pushUuid:
      merged.callSessionId ||
      merged.callUUID ||
      `vendor-call-${appointmentId}`,
  };
}
