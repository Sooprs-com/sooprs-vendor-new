package com.sooprsvendor.call

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.common.SharedUtils

class SooprsFirebaseMessagingReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try {
      val extras = intent.extras ?: return
      val data = mutableMapOf<String, String>()
      for (key in extras.keySet()) {
        val value = extras.get(key)
        if (value != null) {
          data[key] = value.toString()
        }
      }

      if (!IncomingCallPushHandler.isIncomingCallPush(data)) {
        Log.d("SooprsFCMReceiver", "Push received (non-call): $data")
        return
      }

      Log.d("SooprsFCMReceiver", "Incoming call push received: $data")

      if (SharedUtils.isAppInForeground(context)) {
        return
      }

      IncomingCallPushHandler.handle(context, data)
      IncomingCallPushHandler.markNativeHandled(context, data["appointmentId"])
    } catch (error: Exception) {
      Log.e("SooprsFCMReceiver", "Failed to handle incoming call push", error)
    }
  }
}
