package net.kibotu.geofencerelay.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED ||
            intent?.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.d("BootReceiver", "Device reboot completed, checking if tracker should resume...")
            val prefs = context.getSharedPreferences(
                TrackerForegroundService.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            val isRunning = prefs.getBoolean(TrackerForegroundService.KEY_IS_RUNNING, false)

            if (isRunning) {
                Log.d("BootReceiver", "Resuming TrackerForegroundService...")
                TrackerForegroundService.start(context)
            }
        }
    }
}
