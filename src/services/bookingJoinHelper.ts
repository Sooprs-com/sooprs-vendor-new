import {
  HealthAppointment,
  normalizeMeetingStatus,
} from '../types/vendorCall';

function toPositiveId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Appointment id embedded on vendor order / booking payloads. */
export function getOrderAppointmentId(order: Record<string, any> | null | undefined): number | null {
  if (!order) {
    return null;
  }
  return (
    toPositiveId(order.appointment_id) ||
    toPositiveId(order.appointmentId) ||
    toPositiveId(order.health_appointment_id) ||
    toPositiveId(order.healthAppointmentId) ||
    toPositiveId(order.consultation_appointment_id) ||
    toPositiveId(order.consultationAppointmentId) ||
    toPositiveId(order.appointment?.id) ||
    toPositiveId(order.appointment?.appointmentId) ||
    toPositiveId(order.appointment?.appointment_id) ||
    toPositiveId(order.health_appointment?.id) ||
    toPositiveId(order.healthAppointment?.id) ||
    toPositiveId(order.meeting?.appointmentId) ||
    toPositiveId(order.meeting?.appointment_id) ||
    null
  );
}

/** Order / booking id on a health appointment (for list matching). */
export function getAppointmentOrderId(
  appointment: HealthAppointment | Record<string, any> | null | undefined,
): number | null {
  if (!appointment) {
    return null;
  }
  return (
    toPositiveId(appointment.order_id) ||
    toPositiveId(appointment.orderId) ||
    toPositiveId(appointment.package_order_id) ||
    toPositiveId(appointment.packageOrderId) ||
    toPositiveId(appointment.booking_id) ||
    toPositiveId(appointment.bookingId) ||
    toPositiveId(appointment.order?.id) ||
    toPositiveId(appointment.order?.order_id) ||
    toPositiveId(appointment.order?.orderId) ||
    null
  );
}

export function getAppointmentId(
  appointment: HealthAppointment | Record<string, any> | null | undefined,
): number | null {
  if (!appointment) {
    return null;
  }
  return (
    toPositiveId(appointment.id) ||
    toPositiveId(appointment.appointmentId) ||
    toPositiveId(appointment.appointment_id) ||
    null
  );
}

export function isAppointmentJoinable(
  appointment?: HealthAppointment | Record<string, any> | null,
): boolean {
  if (!appointment) {
    return false;
  }
  if (appointment.window?.canJoin === true) {
    return true;
  }
  if (appointment.window?.canJoin === false) {
    return false;
  }
  if (appointment.window?.after || appointment.window?.before) {
    return false;
  }
  const status = normalizeMeetingStatus(
    appointment.status,
    appointment.legacyStatus,
  );
  return status === 'open' || status === 'waiting' || status === 'in_progress';
}

export function isOrderMarkedJoinable(order: Record<string, any> | null | undefined): boolean {
  if (!order) {
    return false;
  }
  if (
    order.window?.canJoin === true ||
    order.can_join === true ||
    order.canJoin === true ||
    order.can_join_call === true ||
    order.meeting_window?.canJoin === true
  ) {
    return true;
  }
  if (
    order.window?.canJoin === false ||
    order.can_join === false ||
    order.canJoin === false
  ) {
    return false;
  }
  return false;
}

/**
 * Resolve the health appointment a booking can join into.
 * Prefer explicit order.appointment_id, then appointment.order_id match.
 */
export function resolveJoinAppointmentForOrder(
  order: Record<string, any> | null | undefined,
  appointments: HealthAppointment[] = [],
): HealthAppointment | null {
  if (!order) {
    return null;
  }

  const directId = getOrderAppointmentId(order);
  if (directId) {
    const found = appointments.find(item => getAppointmentId(item) === directId);
    if (found) {
      return found;
    }
    // Order carries appointment id — allow join-room even if list is stale.
    return {
      id: directId,
      appointmentId: directId,
      window: {canJoin: isOrderMarkedJoinable(order) ? true : undefined},
      status: isOrderMarkedJoinable(order) ? 'open' : undefined,
    } as HealthAppointment;
  }

  const orderId = toPositiveId(order.order_id) || toPositiveId(order.id);
  if (orderId) {
    const byOrder = appointments.find(item => getAppointmentOrderId(item) === orderId);
    if (byOrder) {
      return byOrder;
    }
  }

  // Fallback: exactly one joinable appointment for this customer on an active booking.
  const userId =
    toPositiveId(order.user_id) ||
    toPositiveId(order.userId) ||
    toPositiveId(order.user?.id) ||
    toPositiveId(order.user_details?.id);
  const activeBooking =
    order.order_status === 'CONFIRMED' ||
    order.order_status === 'PENDING' ||
    order.order_status === 'PROCESSING';

  if (userId && activeBooking) {
    const joinableForUser = appointments.filter(item => {
      if (!isAppointmentJoinable(item)) {
        return false;
      }
      const apptUser =
        toPositiveId(item.user_id) ||
        toPositiveId(item.userId) ||
        toPositiveId(item.user?.id) ||
        toPositiveId(item.client_id) ||
        toPositiveId(item.clientId) ||
        toPositiveId(item.patient_id) ||
        toPositiveId(item.patientId);
      return apptUser === userId;
    });
    if (joinableForUser.length === 1) {
      return joinableForUser[0];
    }
  }

  return null;
}

export function canShowJoinNowForBooking(
  order: Record<string, any> | null | undefined,
  appointment?: HealthAppointment | null,
): boolean {
  if (isOrderMarkedJoinable(order)) {
    return true;
  }
  return isAppointmentJoinable(appointment);
}
