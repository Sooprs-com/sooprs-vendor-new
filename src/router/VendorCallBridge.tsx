import {useEffect, useRef} from 'react';
import {useVendorCall} from '../context/VendorCallContext';
import {
  isOnVideoCallScreen,
  leaveVideoCallScreen,
  navigationRef,
} from './navigationRef';

export function VendorCallBridge() {
  const {activeCall} = useVendorCall();
  const wasInCall = useRef(false);

  useEffect(() => {
    if (activeCall) {
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
  }, [activeCall]);

  return null;
}
