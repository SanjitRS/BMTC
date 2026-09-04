package net.kibotu.geofencerelay.util

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.util.Log

object SoundPlayer {

    private var activeRingtone: Ringtone? = null

    fun playFindMySound(context: Context) {
        stopSound()
        try {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

            val ringtone = RingtoneManager.getRingtone(context.applicationContext, alarmUri)
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            ringtone.audioAttributes = audioAttributes

            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0)

            ringtone.play()
            activeRingtone = ringtone
            Log.d("SoundPlayer", "Playing Find My alarm sound at full volume")
        } catch (e: Exception) {
            Log.e("SoundPlayer", "Failed to play sound: ${e.message}", e)
        }
    }

    fun stopSound() {
        try {
            activeRingtone?.stop()
        } catch (_: Exception) {}
        activeRingtone = null
    }
}
