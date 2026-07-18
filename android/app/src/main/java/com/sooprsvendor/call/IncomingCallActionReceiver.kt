package com.sooprsvendor.call

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class IncomingCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) {
      return
    }

    when (intent.action) {
      ACTION_INCOMING_CALL_ANSWERED ->
        IncomingCallNotificationBridge.onAnswered(context, intent.extras)
      ACTION_INCOMING_CALL_DECLINED ->
        IncomingCallNotificationBridge.onDeclined(context, intent.extras)
      ACTION_STOP_INCOMING_RINGTONE ->
        IncomingCallNotificationBridge.stopRingtone(context)
    }
  }

  companion object {
    const val ACTION_INCOMING_CALL_ANSWERED =
      "com.sooprsvendor.action.INCOMING_CALL_ANSWERED"
    const val ACTION_INCOMING_CALL_DECLINED =
      "com.sooprsvendor.action.INCOMING_CALL_DECLINED"
    const val ACTION_STOP_INCOMING_RINGTONE =
      "com.sooprsvendor.action.STOP_INCOMING_RINGTONE"
  }
}
