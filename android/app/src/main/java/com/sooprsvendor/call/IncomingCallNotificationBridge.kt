package com.sooprsvendor.call

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.reactnativefullscreennotificationincomingcall.FullScreenNotificationIncomingCallModule
import com.sooprsvendor.MainActivity
import org.json.JSONObject

/**
 * Handles accept/decline from the full-screen notification library when the
 * React bridge may not be ready (app killed). Stops the native ringtone
 * service and persists the action for JS to process after cold start.
 */
object IncomingCallNotificationBridge {
  private const val TAG = "IncomingCallBridge"

  fun onAnswered(context: Context, bundle: Bundle?) {
    stopRingtone(context)
    if (isJsBridgeReady()) {
      return
    }
    savePendingAction(context, "accept", bundle?.getString("payload"))
    launchMainApp(context)
  }

  fun onDeclined(context: Context, bundle: Bundle?) {
    stopRingtone(context)
    if (isJsBridgeReady()) {
      return
    }
    savePendingAction(context, "reject", bundle?.getString("payload"))
    launchMainApp(context)
  }

  private fun isJsBridgeReady(): Boolean {
    val reactContext = FullScreenNotificationIncomingCallModule.reactContext ?: return false
    return reactContext.hasActiveReactInstance()
  }

  fun stopRingtone(context: Context) {
    try {
      context.stopService(Intent(context, IncomingCallRingtoneService::class.java))
    } catch (error: Exception) {
      Log.w(TAG, "Failed to stop ringtone service", error)
    }
  }

  private fun savePendingAction(context: Context, action: String, payloadJson: String?) {
    if (payloadJson.isNullOrBlank()) {
      Log.w(TAG, "Missing payload for pending $action action")
      return
    }

    try {
      val payload = JSONObject(payloadJson)
      val appointmentId =
        payload.optString("appointmentId", "").ifBlank {
          payload.optInt("appointmentId", 0).takeIf { it > 0 }?.toString() ?: ""
        }

      if (appointmentId.isBlank()) {
        Log.w(TAG, "Missing appointmentId in payload for $action")
        return
      }

      val pending =
        JSONObject()
          .put("action", action)
          .put("savedAt", System.currentTimeMillis())
          .put("data", payload)

      PendingCallActionStorage.save(context, pending.toString())
    } catch (error: Exception) {
      Log.e(TAG, "Failed to save pending $action action", error)
    }
  }

  private fun launchMainApp(context: Context) {
    try {
      val intent = Intent(context, MainActivity::class.java)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      context.startActivity(intent)
    } catch (error: Exception) {
      Log.e(TAG, "Failed to launch main app", error)
    }
  }
}
