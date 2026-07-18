package com.sooprsvendor.call

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.sooprsvendor.R

class IncomingCallRingtoneService : Service() {
  private var mediaPlayer: MediaPlayer? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIFICATION_ID, buildNotification())
    playRingtone()
    return START_STICKY
  }

  override fun onDestroy() {
    stopRingtone()
    super.onDestroy()
  }

  private fun playRingtone() {
    if (mediaPlayer != null) {
      return
    }

    mediaPlayer =
      MediaPlayer.create(this, R.raw.incoming_ring).apply {
        isLooping = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          setAudioAttributes(
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build(),
          )
        }
        start()
      }
  }

  private fun stopRingtone() {
    mediaPlayer?.run {
      stop()
      release()
    }
    mediaPlayer = null
  }

  private fun buildNotification(): Notification {
    val channelId = "vendor_incoming_call_ringtone"
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
        NotificationChannel(channelId, "Incoming Call Ringtone", NotificationManager.IMPORTANCE_LOW)
      manager.createNotificationChannel(channel)
    }

    return NotificationCompat.Builder(this, channelId)
      .setContentTitle("Incoming consultation call")
      .setContentText("Ringing...")
      .setSmallIcon(R.mipmap.ic_launcher)
      .setOngoing(true)
      .build()
  }

  companion object {
    private const val NOTIFICATION_ID = 9911
  }
}
