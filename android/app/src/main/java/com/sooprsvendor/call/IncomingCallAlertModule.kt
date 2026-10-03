package com.sooprsvendor.call

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IncomingCallAlertModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "IncomingCallAlert"

  @ReactMethod
  fun launchMainApp() {
    IncomingCallLaunchHelper.launchMainApp(reactContext)
  }

  @ReactMethod
  fun savePendingAction(json: String, promise: Promise) {
    try {
      PendingCallActionStorage.save(reactContext, json)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("save_pending_action_failed", error)
    }
  }

  @ReactMethod
  fun loadPendingAction(promise: Promise) {
    try {
      promise.resolve(PendingCallActionStorage.load(reactContext))
    } catch (error: Exception) {
      promise.reject("load_pending_action_failed", error)
    }
  }

  @ReactMethod
  fun clearPendingAction(promise: Promise) {
    try {
      PendingCallActionStorage.clear(reactContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("clear_pending_action_failed", error)
    }
  }

  @ReactMethod
  fun wasHandledNatively(appointmentId: String, promise: Promise) {
    try {
      val handled =
        IncomingCallPushHandler.wasNativeHandledRecently(
          reactContext,
          appointmentId.toLongOrNull() ?: 0L,
        )
      promise.resolve(handled)
    } catch (error: Exception) {
      promise.reject("was_handled_natively_failed", error)
    }
  }

  @ReactMethod
  fun startRingtoneService() {
    val intent = Intent(reactContext, IncomingCallRingtoneService::class.java)
    reactContext.startForegroundService(intent)
  }

  @ReactMethod
  fun stopRingtoneService() {
    reactContext.stopService(Intent(reactContext, IncomingCallRingtoneService::class.java))
  }

  @ReactMethod
  fun clearNativeHandled() {
    IncomingCallPushHandler.clearNativeHandled(reactContext)
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }
      val powerManager =
        reactContext.getSystemService(PowerManager::class.java)
      val ignoring =
        powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) == true
      promise.resolve(ignoring)
    } catch (error: Exception) {
      promise.reject("battery_check_failed", error)
    }
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }
      val powerManager =
        reactContext.getSystemService(PowerManager::class.java)
      if (powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) == true) {
        promise.resolve(true)
        return
      }

      val intent =
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:${reactContext.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      // Fall back to battery settings list if the one-tap intent is blocked.
      try {
        val fallback =
          Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        reactContext.startActivity(fallback)
        promise.resolve(true)
      } catch (fallbackError: Exception) {
        promise.reject("battery_request_failed", fallbackError)
      }
    }
  }

  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val intent =
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
            data = Uri.parse("package:${reactContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        reactContext.startActivity(intent)
        promise.resolve(true)
        return
      }
      val appSettings =
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${reactContext.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      reactContext.startActivity(appSettings)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("fullscreen_settings_failed", error)
    }
  }

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        promise.resolve(true)
        return
      }
      val notificationManager =
        reactContext.getSystemService(android.app.NotificationManager::class.java)
      promise.resolve(notificationManager?.canUseFullScreenIntent() == true)
    } catch (error: Exception) {
      promise.reject("fullscreen_check_failed", error)
    }
  }

  /**
   * Called from JS after displayNotification — when the device is locked / screen
   * off, also start IncomingCallActivity so the vendor sees Accept/Reject UI
   * without opening the app manually.
   */
  @ReactMethod
  fun launchFullScreenIfLocked(
    uuid: String,
    title: String,
    body: String,
    acceptLabel: String,
    rejectLabel: String,
    ttlSeconds: Int,
    payloadJson: String,
  ) {
    IncomingCallScreenLauncher.maybeLaunch(
      reactContext,
      uuid,
      title,
      body,
      acceptLabel,
      rejectLabel,
      ttlSeconds,
      payloadJson,
    )
  }
}
