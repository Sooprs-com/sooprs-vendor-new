/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '@react-native-firebase/app';
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import FullScreenIncomingCall from './src/Screen/VideoCall/FullScreenIncomingCall';
import {handleBackgroundIncomingCallPush} from './src/context/VendorCallContext';
import {MAIN_COMPONENT} from './src/services/callKeepService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM Push] Background message received:', {
    messageId: remoteMessage?.messageId,
    from: remoteMessage?.from,
    sentTime: remoteMessage?.sentTime,
    data: remoteMessage?.data,
    notification: remoteMessage?.notification,
  });
  await handleBackgroundIncomingCallPush(remoteMessage.data || {});
});

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent(MAIN_COMPONENT, () => FullScreenIncomingCall);
