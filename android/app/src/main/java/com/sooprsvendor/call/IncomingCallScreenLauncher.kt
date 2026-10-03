package com.sooprsvendor.call

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log
import org.json.JSONObject

/**
 * Best-effort launch of the full-screen IncomingCallActivity when the device is
 * locked / screen is off. Full-screen notification intent remains the primary
 * path; this covers OEMs that ring the FGS but suppress the FSI Activity.
 */
object IncomingCallScreenLauncher {
  private const val TAG = "IncomingCallScreenLauncher"
  private const val ACTIVITY =
    "com.reactnativefullscreennotificationincomingcall.IncomingCallActivity"

  fun maybeLaunch(
    context: Context,
    uuid: String,
    title: String,
    body: String,
    acceptLabel: String,
    rejectLabel: String,
    ttlSeconds: Int,
    payloadJson: String,
  ) {
    if (!shouldForceFullScreen(context)) {
      Log.d(TAG, "Screen interactive and unlocked — relying on notification FSI")
      return
    }

    wakeScreen(context)

    try {
      val intent =
        Intent().setClassName(context.packageName, ACTIVITY).apply {
          addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_SINGLE_TOP or
              Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
              Intent.FLAG_ACTIVITY_CLEAR_TOP,
          )
          putExtra("uuid", uuid)
          putExtra("name", title)
          putExtra("avatar", null as String?)
          putExtra("info", body)
          putExtra("channelId", "com.sooprsvendor.incomingcall.v2")
          putExtra("channelName", "Health Consultation Calls")
          putExtra("timeout", ttlSeconds * 1000)
          putExtra("icon", "ic_launcher")
          putExtra("answerText", acceptLabel)
          putExtra("declineText", rejectLabel)
          putExtra("notificationSound", "incoming_ring")
          putExtra("mainComponent", "VendorIncomingCallScreen")
          putExtra("isVideo", true)
          putExtra("payload", payloadJson)
        }
      context.startActivity(intent)
      Log.d(TAG, "Started IncomingCallActivity directly (locked/off screen)")
    } catch (error: Exception) {
      Log.w(TAG, "Direct IncomingCallActivity start blocked", error)
    }
  }

  private fun shouldForceFullScreen(context: Context): Boolean {
    val powerManager = context.getSystemScreenPowerManager()
    val interactive = powerManager?.isInteractive == true
    val keyguard =
      context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
    val locked = keyguard?.isKeyguardLocked == true
    return !interactive || locked
  }

  private fun wakeScreen(context: Context) {
    try {
      val powerManager = context.getSystemScreenPowerManager() ?: return
      @Suppress("DEPRECATION")
      val wakeLock =
        powerManager.newWakeLock(
          PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
            PowerManager.ACQUIRE_CAUSES_WAKEUP or
            PowerManager.ON_AFTER_RELEASE,
          "sooprsvendor:incoming_call",
        )
      wakeLock.acquire(5_000L)
    } catch (error: Exception) {
      Log.w(TAG, "Failed to acquire wake lock", error)
    }
  }

  private fun Context.getSystemScreenPowerManager(): PowerManager? =
    getSystemService(Context.POWER_SERVICE) as? PowerManager

  fun payloadJson(data: Map<String, String>): String =
    try {
      JSONObject(data as Map<*, *>).toString()
    } catch (_: Exception) {
      "{}"
    }
}
