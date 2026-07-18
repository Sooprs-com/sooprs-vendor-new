package com.sooprsvendor.call

import android.content.Context

object PendingCallActionStorage {
  private const val PREFS = "vendor_pending_call_action"
  private const val KEY = "pending_action_json"

  fun save(context: Context, json: String) {
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY, json)
      .apply()
  }

  fun load(context: Context): String? {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
  }
}
