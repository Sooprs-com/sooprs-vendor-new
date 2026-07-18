import {HEALTH_VIDEO_CONFIG} from '../config/healthVideo';

const {BASE_URL, API_PREFIX} = HEALTH_VIDEO_CONFIG;

async function request(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
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

  startCall: (token: string, appointmentId: number) =>
    request('/call/start', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

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

  joinWaitingRoom: (token: string, appointmentId: number) =>
    request('/call/join-waiting-room', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId}),
    }),

  endCall: (token: string, appointmentId: number, reason = 'ended') =>
    request('/call/end', token, {
      method: 'POST',
      body: JSON.stringify({appointmentId, reason}),
    }),
};
