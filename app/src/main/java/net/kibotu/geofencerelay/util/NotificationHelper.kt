package net.kibotu.geofencerelay.util

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import net.kibotu.geofencerelay.R
import net.kibotu.geofencerelay.ui.MainActivity

object NotificationHelper {

    const val SERVICE_CHANNEL_ID = "geofence_service_channel"
    const val BREACH_CHANNEL_ID = "geofence_breach_channel"
    const val SERVICE_NOTIFICATION_ID = 1001
    const val BREACH_NOTIFICATION_ID = 2001

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val serviceChannel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Geofence Sentinel Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows persistent background location monitoring status"
                setShowBadge(false)
            }

            val breachChannel = NotificationChannel(
                BREACH_CHANNEL_ID,
                "Geofence Breach Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent alerts when target device breaches safe geofence"
                enableVibration(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannel(serviceChannel)
            notificationManager.createNotificationChannel(breachChannel)
        }
    }

    fun buildServiceNotification(
        context: Context,
        isBreached: Boolean,
        statusText: String
    ): Notification {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (isBreached) "?? SAFE ZONE BREACH DETECTED!" else "??? Geofence Sentinel Active"

        return NotificationCompat.Builder(context, SERVICE_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(if (isBreached) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_LOW)
            .build()
    }

    fun showBreachNotification(context: Context, geofenceName: String, distanceMeters: Double) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, BREACH_CHANNEL_ID)
            .setContentTitle("?? Safe Zone Exited!")
            .setContentText("Target device moved outside '$geofenceName' (${LocationUtils.formatDistance(distanceMeters)} away). Live GPS streaming.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(BREACH_NOTIFICATION_ID, notification)
    }
}
