import {useEffect, useRef} from 'react';
import {useVendorCall} from '../context/VendorCallContext';
import {
  isOnVideoCallScreen,
  leaveVideoCallScreen,
  navigateToVideoCall,
  navigationRef,
} from './navigationRef';

/**
 * Keeps navigation in sync with call session state:
 * - activeCall set → ensure VideoCallScreen is showing (Join / Accept recovery)
 * - activeCall cleared (and no rejoin/summary) → leave call screen
 */
export function VendorCallBridge() {
  const {activeCall, canRejoin, lastEndedCall} = useVendorCall();
  const wasInCall = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRedirectedAppointmentRef = useRef<number | null>(null);

  // If join/accept set activeCall but navigation missed VideoCallScreen, push it.
  // Avoid settleHomeFirst reset when already redirecting once — remount tears Agora.
  useEffect(() => {
    if (!activeCall || !navigationRef.isReady()) {
      return;
    }

    if (isOnVideoCallScreen()) {
      wasInCall.current = true;
      lastRedirectedAppointmentRef.current = activeCall.appointmentId;
      return;
    }

    if (lastRedirectedAppointmentRef.current === activeCall.appointmentId) {
      // Already attempted redirect for this session; don't loop resets.
      return;
    }

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      if (!activeCall || isOnVideoCallScreen()) {
        wasInCall.current = true;
        return;
      }
      lastRedirectedAppointmentRef.current = activeCall.appointmentId;
      void navigateToVideoCall(
        {
          channelName: activeCall.channelName,
          token: activeCall.token,
          appId: activeCall.appId,
          uid: activeCall.uid,
          appointmentId: activeCall.appointmentId,
          callKey: String(
            activeCall.callSessionId ||
              `vendor-call-${activeCall.appointmentId}`,
          ),
          uiAction: activeCall.uiAction,
          status: activeCall.status,
          bothPresent: activeCall.bothPresent,
        },
        {settleHomeFirst: true},
      );
      wasInCall.current = true;
    }, 500);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [activeCall]);

  useEffect(() => {
    if (activeCall) {
      wasInCall.current = true;
      return;
    }

    lastRedirectedAppointmentRef.current = null;

    // Soft leave / Agora drop — meeting still open for Orders rejoin.
    // Stay put only if still on VideoCallScreen; do not force-pop home.
    if (canRejoin) {
      wasInCall.current = true;
      return;
    }

    // AfterCall summary still showing — stay put.
    if (lastEndedCall) {
      wasInCall.current = true;
      return;
    }

    if (!wasInCall.current || !navigationRef.isReady()) {
      wasInCall.current = false;
      return;
    }

    wasInCall.current = false;

    if (isOnVideoCallScreen()) {
      leaveVideoCallScreen();
    }
  }, [activeCall, canRejoin, lastEndedCall]);

  return null;
}
