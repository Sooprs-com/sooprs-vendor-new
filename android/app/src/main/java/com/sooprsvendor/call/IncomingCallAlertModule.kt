package com.sooprsvendor.call

import android.content.Intent
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
}
