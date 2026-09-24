import {HEALTH_VIDEO_CONFIG} from '../config/healthVideo';

const {BASE_URL, API_PREFIX} = HEALTH_VIDEO_CONFIG;

export class HealthVideoApiError extends Error {
  code?: string;
  status?: number;
  payload?: any;

  constructor(message: string, options?: {code?: string; status?: number; payload?: any}) {
    super(message);
    this.name = 'HealthVideoApiError';
    this.code = options?.code;
    this.status = options?.status;
    this.payload = options?.payload;
  }
}

function extractErrorCode(json: any): string | undefined {
  return (
    json?.code ||
    json?.errorCode ||
    json?.error?.code ||
    json?.data?.code ||
    undefined
  );
}

async function request(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) {
    const code = extractErrorCode(json);
    const message =
      json?.message ||
      json?.error?.message ||
      (code === 'JOIN_NOT_OPEN'
        ? 'Meeting has not started yet'
        : code === 'JOIN_CLOSED'
          ? 'Meeting time ended'
          : 'Request failed');
    throw new HealthVideoApiError(message, {
      code,
      status: res.status,
      payload: json,
    });
  }
  return json;
}

export const healthVideoApi = {
  registerDevice: (token: string, deviceToken: string, platform: string) =>
    request('/devices/register', token, {
      method: 'POST',
      body: JSON.stringify({deviceToken, platform}),
    }),

  listAppointments: (token: string) => request('/appointments', token),

  getAppointment: (token: string, appointmentId: number) =>
    request(`/appointments/${appointmentId}`, token),

  /** @deprecated Prefer joinRoom — kept for old builds / compat */
  startCall: (token: string, appointmentId: number) =>
    request('/call/start', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

  /**
   * Primary join path (Google Meet style).
   * Doctor-first → waiting; patient already waiting → in_progress.
   */
  joinRoom: (token: string, appointmentId: number) =>
    request('/call/join-room', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

  /**
   * Compat only — backend maps this to join-room.
   * New UI must call joinRoom, not acceptCall.
   */
  acceptCall: (token: string, appointmentId: number) =>
    request('/call/accept', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

  rejectCall: (token: string, reason: string, appointmentId: number) =>
    request('/call/reject', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId, reason}),
    }),

  /** @deprecated Prefer joinRoom */
  joinWaitingRoom: (token: string, appointmentId: number) =>
    request('/call/join-waiting-room', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

  /**
   * Temporary drop (Agora/network) — meeting stays open for rejoin.
   * Do NOT use endCall for disconnects.
   */
  leaveRoom: (
    token: string,
    appointmentId: number,
    reason = 'agora_disconnect',
  ) =>
    request('/call/leave-room', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId, reason}),
    }),

  /** Explicit hang-up only */
  endCall: (token: string, appointmentId: number, reason = 'ended') =>
    request('/call/end', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId, reason}),
    }),
};
