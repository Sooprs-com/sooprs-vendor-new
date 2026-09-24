package com.sooprsvendor

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.sooprsvendor.call.IncomingCallLaunchHelper
import com.sooprsvendor.call.PendingCallActionStorage

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "sooprsVendor"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showOverLockScreenIfCallPending()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    showOverLockScreenIfCallPending()
  }

  /**
   * When the app is cold-started (or brought to front) by tapping Accept/Join on the
   * full-screen incoming-call notification while the device is locked, the
   * launcher activity is otherwise placed *behind* the secure keyguard — the
   * user only sees the lock screen and has to manually unlock + open the app for
   * the call to join. Explicitly turning the screen on, showing over the lock
   * screen, and requesting keyguard dismissal brings the app to the foreground
   * so the pending-accept retry loop can navigate straight into the video call.
   *
   * Guarded on a pending call action so normal launches keep default secure
   * behaviour.
   */
  private fun showOverLockScreenIfCallPending() {
    val launchedFromIncomingCall =
      intent?.getBooleanExtra(IncomingCallLaunchHelper.EXTRA_FROM_INCOMING_CALL, false) == true
    val hasPendingCall = try {
      PendingCallActionStorage.load(this) != null
    } catch (_: Exception) {
      false
    }
    if (!launchedFromIncomingCall && !hasPendingCall) {
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
      )
    }

    val keyguardManager =
      getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1 &&
      keyguardManager?.isKeyguardLocked == true
    ) {
      keyguardManager.requestDismissKeyguard(this, null)
    }
  }

  override fun onResume() {
    super.onResume()
    IncomingCallLaunchHelper.onMainActivityResumed()
  }

  override fun onPause() {
    IncomingCallLaunchHelper.onMainActivityPaused()
    super.onPause()
  }
}
