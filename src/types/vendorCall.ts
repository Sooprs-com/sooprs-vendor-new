export type MeetingStatus =
  | 'scheduled'
  | 'open'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'rejected'
  | 'cancelled';

export type MeetingEndReason =
  | 'normal_end'
  | 'client_no_show'
  | 'vendor_no_show'
  | 'both_no_show'
  | string;

export type AppointmentWindow = {
  canJoin?: boolean;
  before?: boolean;
  after?: boolean;
  startsAt?: string;
  endsAt?: string;
  [key: string]: any;
};

export type MeetingInfo = {
  talkDurationSeconds?: number | null;
  userJoinedAt?: string | null;
  vendorJoinedAt?: string | null;
  endReason?: MeetingEndReason | null;
  [key: string]: any;
};

export type HealthAppointment = {
  id: number;
  status?: MeetingStatus | string;
  appointment_at?: string;
  appointmentAt?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  patientName?: string;
  patient_name?: string;
  user?: {name?: string; [key: string]: any};
  window?: AppointmentWindow;
  meeting?: MeetingInfo;
  ratingStatus?: 'pending' | 'submitted' | string;
  clientRating?: {
    rating?: number;
    comment?: string;
    raterType?: string;
    status?: string;
    [key: string]: any;
  } | null;
  ratings?: any[];
  [key: string]: any;
};

export type JoinRoomResult = AgoraCallData & {
  bothPresent?: boolean;
  uiAction?: string;
  status?: MeetingStatus | string;
  rejoin?: boolean;
  meetingStillOpen?: boolean;
  canRejoin?: boolean;
};

export type IncomingCallData = {
  appointmentId: number;
  callSessionId?: string;
  channelName?: string;
  token?: string;
  appId?: string;
  uid?: number;
  participantRole?: string;
  acceptButtonLabel?: string;
  rejectButtonLabel?: string;
  playRingtone?: boolean;
  patientName?: string;
  fromPush?: boolean;
  uiAction?: string;
  isPeerWaiting?: boolean;
  softMiss?: boolean;
  meetingStillOpen?: boolean;
  status?: MeetingStatus | string;
  [key: string]: any;
};

export type AgoraCallData = {
  appointmentId: number;
  callSessionId?: string;
  token: string;
  channelName: string;
  appId: string;
  uid: number;
  bothPresent?: boolean;
  uiAction?: string;
  status?: MeetingStatus | string;
  rejoin?: boolean;
  [key: string]: any;
};

export function toAgoraCallData(payload: Record<string, any>): AgoraCallData | null {
  const appointmentId = Number(payload?.appointmentId);
  const token = payload?.token;
  const channelName = payload?.channelName;
  const appId = payload?.appId;
  const uid = Number(payload?.uid);

  if (!appointmentId || !token || !channelName || !appId || Number.isNaN(uid)) {
    return null;
  }

  return {
    appointmentId,
    callSessionId: payload?.callSessionId,
    token,
    channelName,
    appId,
    uid,
    bothPresent: payload?.bothPresent,
    uiAction: payload?.uiAction,
    status: payload?.status,
    rejoin: payload?.rejoin,
    ...payload,
  };
}

export type CallNotification = {
  title?: string;
  message?: string;
  type?: string;
  appointmentId?: number | null;
  softMiss?: boolean;
  meetingStillOpen?: boolean;
  status?: string;
  [key: string]: any;
};

export function getVendorStatusLabel(status?: string | null): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'open':
      return 'Open — Join';
    case 'waiting':
      return 'Waiting for patient';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'no_show':
      return 'No show';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    // Legacy aliases (old builds only — do not drive new UI)
    case 'ringing':
      return 'Open — Join';
    case 'accepted':
      return 'In progress';
    case 'missed':
      return 'No show';
    default:
      return status ? String(status) : 'Unknown';
  }
}

export function getVendorMissReasonMessage(
  endReason?: string | null,
  status?: string | null,
): string | null {
  if (status === 'rejected') {
    return 'Call rejected';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  switch (endReason) {
    case 'client_no_show':
      return "Patient didn’t join";
    case 'vendor_no_show':
      return 'You missed — patient was waiting';
    case 'both_no_show':
      return 'Consultation missed';
    case 'normal_end':
      return null;
    default:
      return null;
  }
}

export function formatTalkDuration(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) {
    return '—';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) {
    return `${secs}s`;
  }
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function normalizeMeetingStatus(
  status?: string | null,
  legacyStatus?: string | null,
): MeetingStatus | string {
  // Prefer new status; ignore legacyStatus for new UI logic.
  if (status) {
    return status;
  }
  // Fallback mapping only when status is missing entirely.
  switch (legacyStatus) {
    case 'ringing':
      return 'open';
    case 'accepted':
      return 'in_progress';
    case 'missed':
      return 'no_show';
    default:
      return legacyStatus || 'scheduled';
  }
}
