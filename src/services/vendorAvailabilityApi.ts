import {mobile_siteConfig} from './mobile-siteConfig';
import {
  deleteDataWithToken,
  getDataWithToken,
  PutDataWithToken,
  postDataWithToken,
} from './mobile-api';

export type AvailabilitySlot = {
  id?: number;
  vendorId?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive?: boolean;
};

export type AvailabilityPayload = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

export type BlockedDate = {
  date: string;
  reason?: string;
};

async function parseJsonResponse(res: Response | undefined) {
  if (!res) {
    throw new Error('No response from server');
  }
  return res.json();
}

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatTimeDisplay(time: string): string {
  if (!time) {
    return '';
  }
  return time.slice(0, 5);
}

export function toApiTime(time: string): string {
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
}

export function mapAvailabilityFromApi(raw: any): AvailabilitySlot {
  return {
    id: raw.id,
    vendorId: raw.vendorId ?? raw.vendor_id,
    dayOfWeek: raw.dayOfWeek ?? raw.day_of_week,
    startTime: raw.startTime ?? raw.start_time ?? '',
    endTime: raw.endTime ?? raw.end_time ?? '',
    slotDurationMinutes:
      raw.slotDurationMinutes ?? raw.slot_duration_minutes ?? 30,
    isActive: raw.isActive ?? raw.is_active ?? true,
  };
}

export function mapAvailabilityToApi(slot: AvailabilitySlot): AvailabilityPayload {
  return {
    day_of_week: slot.dayOfWeek,
    start_time: toApiTime(slot.startTime),
    end_time: toApiTime(slot.endTime),
    slot_duration_minutes: slot.slotDurationMinutes,
  };
}

export function getConsultationConfig(data: any) {
  return (
    data?.consultation_config ??
    data?.vendorDetail?.consultation_config ??
    data?.data?.consultation_config
  );
}

export function canEnablePackageAppointment(data: any): boolean {
  return getConsultationConfig(data)?.can_enable_package_appointment === true;
}

export async function checkAppointmentAllowed(): Promise<boolean> {
  const endpoint = mobile_siteConfig.GET_USER_DETAILS;
  console.log('[Add Slot API] checkAppointmentAllowed → GET', endpoint);
  const res: any = await getDataWithToken({}, endpoint);
  const data: any = await res.json();
  console.log('[Add Slot API] checkAppointmentAllowed ← response', data);
  const allowed =
    getConsultationConfig(data)?.requires_appointment_allowed === true;
  console.log('[Add Slot API] checkAppointmentAllowed ← allowed:', allowed);
  return allowed;
}

export async function fetchVendorAvailability() {
  const endpoint = mobile_siteConfig.VENDOR_AVAILABILITY;
  console.log('[Add Slot API] fetchVendorAvailability → GET', endpoint);
  const res: any = await getDataWithToken({}, endpoint);
  const data: any = await parseJsonResponse(res);
  console.log('[Add Slot API] fetchVendorAvailability ← response', data);
  const payload = data?.data ?? data;
  const availability = Array.isArray(payload?.availability)
    ? payload.availability.map(mapAvailabilityFromApi)
    : [];

  return {
    success: data?.success !== false,
    vendorId: payload?.vendorId ?? payload?.vendor_id,
    timezone: payload?.timezone ?? 'Asia/Kolkata',
    timezoneLabel: payload?.timezoneLabel ?? payload?.timezone_label ?? 'IST',
    availability: availability.filter((slot: AvailabilitySlot) => slot.isActive !== false),
    message: data?.message,
  };
}

export async function saveVendorAvailability(slots: AvailabilitySlot[]) {
  const endpoint = mobile_siteConfig.VENDOR_AVAILABILITY;
  const body = {
    availability: slots.map(mapAvailabilityToApi),
  };
  console.log('[Add Slot API] saveVendorAvailability → PUT', endpoint, body);
  const result = await PutDataWithToken(body, endpoint);
  console.log('[Add Slot API] saveVendorAvailability ← response', result);
  return result;
}

export async function fetchBlockedDates(month: string) {
  const endpoint = `${mobile_siteConfig.VENDOR_BLOCKED_DATES}?month=${month}`;
  console.log('[Add Slot API] fetchBlockedDates → GET', endpoint);
  const res: any = await getDataWithToken({}, endpoint);
  const data: any = await parseJsonResponse(res);
  console.log('[Add Slot API] fetchBlockedDates ← response', data);
  const payload = data?.data ?? data;
  const rawDates =
    payload?.blockedDates ??
    payload?.blocked_dates ??
    payload?.dates ??
  [];

  const blockedDates: BlockedDate[] = Array.isArray(rawDates)
    ? rawDates.map((item: any) =>
        typeof item === 'string'
          ? {date: item}
          : {
              date: item.date ?? item.blocked_date,
              reason: item.reason,
            },
      )
    : [];

  return {
    success: data?.success !== false,
    blockedDates,
    message: data?.message,
  };
}

export async function blockDates(dates: string[], reason = 'Holiday') {
  return postDataWithToken(
    {dates, reason},
    mobile_siteConfig.VENDOR_BLOCKED_DATES,
  );
}

export async function unblockDates(dates: string[]) {
  return deleteDataWithToken({dates}, mobile_siteConfig.VENDOR_BLOCKED_DATES);
}

export function createDefaultWeekSchedule(): AvailabilitySlot[] {
  return Array.from({length: 7}, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: '10:00',
    endTime: '14:00',
    slotDurationMinutes: 30,
    isActive: false,
  }));
}

export function mergeAvailabilityWithWeek(
  availability: AvailabilitySlot[],
): AvailabilitySlot[] {
  const week = createDefaultWeekSchedule();
  availability.forEach(slot => {
    const index = week.findIndex(item => item.dayOfWeek === slot.dayOfWeek);
    if (index >= 0) {
      week[index] = {
        ...week[index],
        ...slot,
        startTime: formatTimeDisplay(slot.startTime),
        endTime: formatTimeDisplay(slot.endTime),
        isActive: true,
      };
    }
  });
  return week;
}

export function getActiveSlotsForSave(week: AvailabilitySlot[]): AvailabilitySlot[] {
  return week
    .filter(slot => slot.isActive)
    .map(slot => ({
      ...slot,
      startTime: toApiTime(slot.startTime),
      endTime: toApiTime(slot.endTime),
      slotDurationMinutes: Math.min(180, Math.max(5, slot.slotDurationMinutes || 30)),
    }));
}

export function formatMonthKey(year: number, monthIndex: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  return `${year}-${month}`;
}
