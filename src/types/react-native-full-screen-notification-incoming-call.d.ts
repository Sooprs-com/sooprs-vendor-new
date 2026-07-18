declare module 'react-native-full-screen-notification-incoming-call' {
  import type {ComponentType} from 'react';

  export interface ForegroundOptionsModel {
    channelId: string;
    channelName: string;
    notificationIcon: string;
    notificationTitle: string;
    notificationBody?: string | null;
    answerText: string;
    declineText: string;
    notificationColor?: string;
    notificationSound?: string;
    mainComponent?: string;
    isVideo?: boolean;
    payload?: any;
  }

  export interface AnswerPayload {
    callUUID: string;
    payload?: string;
  }

  export interface DeclinePayload {
    callUUID: string;
    payload?: string;
    endAction: 'ACTION_REJECTED_CALL' | 'ACTION_HIDE_CALL';
  }

  class RNNotificationCall {
    displayNotification(
      uuid: string,
      avatar: string | null,
      timeout: number | null,
      foregroundOptions: ForegroundOptionsModel,
    ): void;
    hideNotification(): void;
    backToApp(): void;
    answerCall(uuid: string, payload?: string): void;
    declineCall(uuid: string, payload?: string): void;
    addEventListener(
      eventName: 'answer',
      handler: (payload: AnswerPayload) => void,
    ): void;
    addEventListener(
      eventName: 'endCall',
      handler: (payload: DeclinePayload) => void,
    ): void;
    removeEventListener(eventName: 'answer' | 'endCall'): void;
  }

  const RNNotificationCallDefault: RNNotificationCall;
  export default RNNotificationCallDefault;
}
