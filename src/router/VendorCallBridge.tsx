import {useEffect, useRef} from 'react';
import {useVendorCall} from '../context/VendorCallContext';
import {navigationRef} from './navigationRef';

export function VendorCallBridge() {
  const {activeCall} = useVendorCall();
  const wasInCall = useRef(false);

  useEffect(() => {
    if (activeCall) {
      wasInCall.current = true;
      return;
    }

    if (wasInCall.current && navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
    wasInCall.current = false;
  }, [activeCall]);

  return null;
}
