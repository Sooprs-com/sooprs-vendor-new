package com.sooprsvendor.call

import android.content.Context
import android.content.Intent

object IncomingCallLaunchHelper {
  @Volatile
  var isMainAppInForeground: Boolean = false

  const val EXTRA_FROM_INCOMING_CALL = "from_incoming_call"

  private var lastLaunchMs: Long = 0L
  private const val LAUNCH_DEBOUNCE_MS = 2500L

  fun onMainActivityResumed() {
    isMainAppInForeground = true
  }

  fun onMainActivityPaused() {
    isMainAppInForeground = false
  }

  /**
   * Brings the main launcher activity to the foreground after accepting an
   * incoming call. Must NOT use FLAG_ACTIVITY_CLEAR_TOP — that pops the
   * navigation stack (e.g. VideoCallScreen) right after the user joins.
   *
   * Must be called WHILE the full-screen incoming-call Activity is still
   * visible; Android blocks background launches once that Activity finishes.
   */
  fun launchMainApp(context: Context) {
    try {
      context.stopService(Intent(context, IncomingCallRingtoneService::class.java))
    } catch (_: Exception) {
      // Ringtone service may already be stopped
    }

    if (isMainAppInForeground) {
      return
    }

    val now = System.currentTimeMillis()
    if (now - lastLaunchMs < LAUNCH_DEBOUNCE_MS) {
      return
    }
    lastLaunchMs = now

    val appContext = context.applicationContext
    val launchIntent =
      appContext.packageManager.getLaunchIntentForPackage(appContext.packageName) ?: return

    launchIntent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
    )
    // Tag the launch so MainActivity can immediately show over the lock screen /
    // dismiss the keyguard even if the pending-call flag write to SharedPreferences
    // has not landed yet (bridge write races with a cold start).
    launchIntent.putExtra(EXTRA_FROM_INCOMING_CALL, true)
    appContext.startActivity(launchIntent)
  }
}
