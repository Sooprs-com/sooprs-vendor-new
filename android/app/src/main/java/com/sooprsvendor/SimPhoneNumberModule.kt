package com.sooprsvendor

import android.content.Context
import android.telephony.TelephonyManager
import android.telephony.SubscriptionManager
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class SimPhoneNumberModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SimPhoneNumberModule"
    }

    @ReactMethod
    fun getAllPhoneNumbers(promise: Promise) {
        try {
            val context = reactApplicationContext
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            val subscriptionManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
            } else {
                null
            }

            val phoneNumbers = Arguments.createArray()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1 && subscriptionManager != null) {
                // For Android 5.1+ (API 22+), use SubscriptionManager
                val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                
                if (subscriptionInfoList != null && subscriptionInfoList.isNotEmpty()) {
                    subscriptionInfoList.forEachIndexed { index, subscriptionInfo ->
                        val phoneNumber = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            // Android 13+ (API 33+)
                            subscriptionInfo.number
                        } else {
                            // Android 5.1 to 12
                            @Suppress("DEPRECATION")
                            subscriptionInfo.number
                        }

                        if (!phoneNumber.isNullOrBlank()) {
                            val simInfo = Arguments.createMap()
                            simInfo.putInt("id", subscriptionInfo.subscriptionId)
                            simInfo.putString("label", "SIM ${index + 1}")
                            simInfo.putString("phoneNumber", phoneNumber)
                            phoneNumbers.pushMap(simInfo)
                        }
                    }
                } else {
                    // Fallback: Try to get phone number from TelephonyManager
                    val phoneNumber = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        telephonyManager.line1Number
                    } else {
                        @Suppress("DEPRECATION")
                        telephonyManager.line1Number
                    }

                    if (!phoneNumber.isNullOrBlank()) {
                        val simInfo = Arguments.createMap()
                        simInfo.putInt("id", 1)
                        simInfo.putString("label", "SIM 1")
                        simInfo.putString("phoneNumber", phoneNumber)
                        phoneNumbers.pushMap(simInfo)
                    }
                }
            } else {
                // For older Android versions, use TelephonyManager directly
                val phoneNumber = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    telephonyManager.line1Number
                } else {
                    @Suppress("DEPRECATION")
                    telephonyManager.line1Number
                }

                if (!phoneNumber.isNullOrBlank()) {
                    val simInfo = Arguments.createMap()
                    simInfo.putInt("id", 1)
                    simInfo.putString("label", "SIM 1")
                    simInfo.putString("phoneNumber", phoneNumber)
                    phoneNumbers.pushMap(simInfo)
                }
            }

            promise.resolve(phoneNumbers)
        } catch (e: Exception) {
            promise.reject("SIM_ERROR", "Error getting phone numbers: ${e.message}", e)
        }
    }
}

