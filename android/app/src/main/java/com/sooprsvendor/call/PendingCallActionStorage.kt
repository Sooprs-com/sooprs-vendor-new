package com.sooprsvendor.call

import android.content.Context

object PendingCallActionStorage {
  private const val PREFS = "vendor_pending_call_action"
  private const val KEY = "pending_action_json"

  fun save(context: Context, json: String) {
    // commit() (not apply) so the write lands before IncomingCallActivity
    // finishAndRemoveTask() can kill the process on killed-state Accept.
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY, json)
      .commit()
  }

  fun load(context: Context): String? {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).commit()
  }
}
