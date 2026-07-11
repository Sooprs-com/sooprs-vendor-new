import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigateToVideoCall(params: {
  channelName: string;
  token: string;
  appId: string;
  uid: number;
  appointmentId?: number;
}) {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate('Authentication', {
    screen: 'VendorDrawer',
    params: {
      screen: 'VendorHomeScreen',
      params: {
        screen: 'VideoCallScreen',
        params: {
          role: 'vendor',
          ...params,
        },
      },
    },
  });
}
