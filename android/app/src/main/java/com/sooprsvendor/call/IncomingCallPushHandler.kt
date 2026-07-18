package com.sooprsvendor.call

import android.content.Context
import android.content.Intent
import android.util.Log
import com.reactnativefullscreennotificationincomingcall.Constants
import com.reactnativefullscreennotificationincomingcall.IncomingCallService
import org.json.JSONObject

object IncomingCallPushHandler {
  private const val TAG = "IncomingCallPushHandler"
  private const val PREFS = "vendor_incoming_call_native"
  private const val KEY = "last_handled_appointment"

  fun isIncomingCallPush(data: Map<String, String>): Boolean {
    val event = data["event"]?.lowercase() ?: data["type"]?.lowercase()
    val category = data["notificationCategory"]?.uppercase()
    val uiAction = data["uiAction"]?.lowercase()

    if (event == "incoming-call" || event == "incoming_call") {
      return true
    }
    if (category == "HEALTH_INCOMING_CALL") {
      return true
    }
    if (uiAction == "show_incoming_ring") {
      return true
    }
    return false
  }

  fun markNativeHandled(context: Context, appointmentId: String?) {
    if (appointmentId.isNullOrBlank()) {
      return
    }
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(KEY, appointmentId.toLongOrNull() ?: 0L)
      .putLong("${KEY}_at", System.currentTimeMillis())
      .apply()
  }

  fun wasNativeHandledRecently(context: Context, appointmentId: Long): Boolean {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val handledId = prefs.getLong(KEY, 0L)
    val handledAt = prefs.getLong("${KEY}_at", 0L)
    return handledId == appointmentId && System.currentTimeMillis() - handledAt < 60_000
  }

  fun clearNativeHandled(context: Context) {
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY)
      .remove("${KEY}_at")
      .apply()
  }

  fun handle(context: Context, data: Map<String, String>) {
    if (!isIncomingCallPush(data)) {
      return
    }

    val appointmentId = data["appointmentId"] ?: return
    val participantRole = data["participantRole"]
    if (!participantRole.isNullOrBlank() && participantRole != "receiver") {
      return
    }

    // Each new ring should be treated as a fresh incoming session.
    clearNativeHandled(context)

    val uuid = data["callSessionId"] ?: "vendor-call-$appointmentId"
    val title = data["title"] ?: "Incoming Consultation"
    val body = data["body"] ?: "Patient is waiting for you"
    val acceptLabel = data["acceptButtonLabel"] ?: "Accept"
    val rejectLabel = data["rejectButtonLabel"] ?: "Reject"
    val ttlSeconds = data["ttlSeconds"]?.toIntOrNull() ?: 30
    val payloadJson = JSONObject(data as Map<*, *>).toString()

    val intent =
      Intent(context, IncomingCallService::class.java).apply {
        putExtra("uuid", uuid)
        putExtra("name", title)
        putExtra("avatar", null as String?)
        putExtra("info", body)
        putExtra("channelId", "com.sooprsvendor.incomingcall")
        putExtra("channelName", "Health Consultation Calls")
        putExtra("timeout", ttlSeconds * 1000)
        putExtra("icon", "ic_launcher")
        putExtra("answerText", acceptLabel)
        putExtra("declineText", rejectLabel)
        putExtra("notificationSound", "incoming_ring")
        putExtra("mainComponent", "VendorIncomingCallScreen")
        putExtra("isVideo", true)
        putExtra("payload", payloadJson)
        action = Constants.ACTION_SHOW_INCOMING_CALL
      }

    try {
      context.startForegroundService(intent)
      context.startForegroundService(Intent(context, IncomingCallRingtoneService::class.java))
      markNativeHandled(context, appointmentId)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to show incoming call notification", error)
    }
  }
}
