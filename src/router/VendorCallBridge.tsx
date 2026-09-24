import {useEffect, useRef} from 'react';
import {useVendorCall} from '../context/VendorCallContext';
import {
  isOnVideoCallScreen,
  leaveVideoCallScreen,
  navigationRef,
} from './navigationRef';

export function VendorCallBridge() {
  const {activeCall, canRejoin, lastEndedCall} = useVendorCall();
  const wasInCall = useRef(false);

  useEffect(() => {
    if (activeCall) {
      wasInCall.current = true;
      return;
    }

    // Temporary Agora drop — stay on VideoCallScreen for Rejoin.
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
