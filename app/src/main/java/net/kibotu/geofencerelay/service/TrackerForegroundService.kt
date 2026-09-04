package net.kibotu.geofencerelay.service

import android.annotation.SuppressLint
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.kibotu.geofencerelay.model.BreachAlert
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import net.kibotu.geofencerelay.relay.MqttRelayClient
import net.kibotu.geofencerelay.util.BatteryUtils
import net.kibotu.geofencerelay.util.LocationUtils
import net.kibotu.geofencerelay.util.NotificationHelper
import net.kibotu.geofencerelay.util.SoundPlayer
import java.util.UUID

class TrackerForegroundService : Service() {

    private val tag = "FindMyService"
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private var deviceId: String = ""
    private var deviceName: String = ""
    private var activeZone: GeofenceZone? = null
    private var isCurrentlyBreached: Boolean = false

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return
            handleNewLocation(location)
        }
    }

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        deviceId = prefs.getString(KEY_DEVICE_ID, null) ?: UUID.randomUUID().toString().take(8).also {
            prefs.edit().putString(KEY_DEVICE_ID, it).apply()
        }
        deviceName = Build.MODEL ?: "Android Device"

        _serviceRunning.value = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopTracking()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                startTracking()
            }
        }
        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startTracking() {
        val initialNotification = NotificationHelper.buildServiceNotification(
            context = this,
            isBreached = false,
            statusText = "Sharing location with authorized Google Accounts..."
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NotificationHelper.SERVICE_NOTIFICATION_ID,
                initialNotification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(NotificationHelper.SERVICE_NOTIFICATION_ID, initialNotification)
        }

        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_IS_RUNNING, true).apply()

        // 1. Connect and listen for zones and remote commands (e.g. Play Sound)
        scope.launch {
            val authorizedEmails = getAuthorizedEmails()
            if (authorizedEmails.isNotEmpty()) {
                val primary = authorizedEmails.first()
                MqttRelayClient.shared.connect(primary)

                for (email in authorizedEmails) {
                    MqttRelayClient.shared.subscribeForEmail(email)
                }
            }

            // Listen for remote commands (e.g. Find My "Play Sound")
            launch {
                MqttRelayClient.shared.incomingCommand.collect { cmd ->
                    when (cmd.command) {
                        "PLAY_SOUND" -> SoundPlayer.playFindMySound(applicationContext)
                        "STOP_SOUND" -> SoundPlayer.stopSound()
                    }
                }
            }

            // Listen for active zone updates from Guardian
            launch {
                MqttRelayClient.shared.activeZone.collect { zone ->
                    if (zone != null) {
                        activeZone = zone
                        Log.d(tag, "Active safe zone updated: ${zone.name}, r=${zone.radiusMeters}m")
                        updateNotification("Monitoring Safe Zone: ${zone.name}")
                    }
                }
            }
        }

        // 2. Fetch IMMEDIATE Location fix so guardian doesn't wait
        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) {
                    handleNewLocation(loc)
                }
            }
        } catch (_: SecurityException) {}

        // 3. Request high-accuracy continuous updates
        requestLocationUpdates(isHighFrequency = false)
    }

    @SuppressLint("MissingPermission")
    private fun requestLocationUpdates(isHighFrequency: Boolean) {
        fusedLocationClient.removeLocationUpdates(locationCallback)

        val intervalMs = if (isHighFrequency) 3000L else 10000L
        val minDistance = if (isHighFrequency) 2f else 5f

        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            intervalMs
        ).setMinUpdateIntervalMillis(2000L)
            .setMinUpdateDistanceMeters(minDistance)
            .setWaitForAccurateLocation(true)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(
                request,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            Log.e(tag, "Missing location permission: ${e.message}")
        }
    }

    private fun handleNewLocation(location: Location) {
        val zone = activeZone
        val lat = location.latitude
        val lon = location.longitude
        val accuracy = location.accuracy
        val speed = location.speed

        val distance = if (zone != null) {
            LocationUtils.distanceMeters(lat, lon, zone.latitude, zone.longitude)
        } else {
            0.0
        }

        val isInside = if (zone != null) distance <= zone.radiusMeters else true

        // Breach transition check
        if (!isInside && !isCurrentlyBreached) {
            isCurrentlyBreached = true
            Log.w(tag, "BREACH: Outside safe zone by ${distance}m")

            NotificationHelper.showBreachNotification(
                this,
                zone?.name ?: "Safe Zone",
                distance - (zone?.radiusMeters ?: 0.0)
            )
            updateNotification("?? OUTSIDE SAFE ZONE (${LocationUtils.formatDistance(distance)} from center)")
            requestLocationUpdates(isHighFrequency = true)

            scope.launch {
                val alert = BreachAlert(
                    deviceId = deviceId,
                    geofenceId = zone?.id ?: "",
                    geofenceName = zone?.name ?: "Safe Zone",
                    latitude = lat,
                    longitude = lon,
                    distanceMeters = distance,
                    status = "BREACH_STARTED"
                )
                broadcastToAuthorizedAccounts { email ->
                    MqttRelayClient.shared.publishAlert(email, alert)
                }
            }
        } else if (isInside && isCurrentlyBreached) {
            isCurrentlyBreached = false
            updateNotification("??? Back inside ${zone?.name ?: "Safe Zone"}")
            requestLocationUpdates(isHighFrequency = false)

            scope.launch {
                val alert = BreachAlert(
                    deviceId = deviceId,
                    geofenceId = zone?.id ?: "",
                    geofenceName = zone?.name ?: "Safe Zone",
                    latitude = lat,
                    longitude = lon,
                    distanceMeters = distance,
                    status = "RESOLVED_INSIDE"
                )
                broadcastToAuthorizedAccounts { email ->
                    MqttRelayClient.shared.publishAlert(email, alert)
                }
            }
        }

        // Live telemetry broadcast with reverse geocoded address and battery
        scope.launch {
            val battery = BatteryUtils.getBatteryStatus(applicationContext)
            val address = LocationUtils.getReadableAddress(applicationContext, lat, lon)

            val ping = LocationPing(
                deviceId = deviceId,
                deviceName = deviceName,
                latitude = lat,
                longitude = lon,
                accuracy = accuracy,
                speed = speed,
                batteryLevel = battery.level,
                isCharging = battery.isCharging,
                address = address,
                isBreach = isCurrentlyBreached,
                distanceFromCenter = distance,
                timestamp = System.currentTimeMillis()
            )

            broadcastToAuthorizedAccounts { email ->
                MqttRelayClient.shared.publishPing(email, ping)
            }
            _latestDevicePing.value = ping
        }
    }

    private suspend fun broadcastToAuthorizedAccounts(action: suspend (String) -> Unit) {
        val emails = getAuthorizedEmails()
        for (email in emails) {
            try {
                action(email)
            } catch (e: Exception) {
                Log.e(tag, "Failed to broadcast to $email: ${e.message}")
            }
        }
    }

    private fun getAuthorizedEmails(): Set<String> {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getStringSet(KEY_AUTHORIZED_EMAILS, emptySet()) ?: emptySet()
    }

    private fun updateNotification(statusText: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationHelper.buildServiceNotification(
            context = this,
            isBreached = isCurrentlyBreached,
            statusText = statusText
        )
        nm.notify(NotificationHelper.SERVICE_NOTIFICATION_ID, notification)
    }

    private fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        SoundPlayer.stopSound()
        MqttRelayClient.shared.disconnect()
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_IS_RUNNING, false).apply()
        _serviceRunning.value = false
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopTracking()
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "ACTION_START_TRACKING"
        const val ACTION_STOP = "ACTION_STOP_TRACKING"

        const val PREFS_NAME = "findmy_tracker_prefs"
        const val KEY_IS_RUNNING = "key_is_running"
        const val KEY_DEVICE_ID = "key_device_id"
        const val KEY_AUTHORIZED_EMAILS = "key_authorized_emails"

        private val _serviceRunning = MutableStateFlow(false)
        val serviceRunning = _serviceRunning.asStateFlow()

        private val _latestDevicePing = MutableStateFlow<LocationPing?>(null)
        val latestDevicePing = _latestDevicePing.asStateFlow()

        fun start(context: Context) {
            val intent = Intent(context, TrackerForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, TrackerForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun addAuthorizedEmail(context: Context, email: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val current = prefs.getStringSet(KEY_AUTHORIZED_EMAILS, emptySet())?.toMutableSet() ?: mutableSetOf()
            current.add(email.trim().lowercase())
            prefs.edit().putStringSet(KEY_AUTHORIZED_EMAILS, current).apply()
        }

        fun removeAuthorizedEmail(context: Context, email: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val current = prefs.getStringSet(KEY_AUTHORIZED_EMAILS, emptySet())?.toMutableSet() ?: mutableSetOf()
            current.remove(email.trim().lowercase())
            prefs.edit().putStringSet(KEY_AUTHORIZED_EMAILS, current).apply()
        }

        fun getAuthorizedEmails(context: Context): Set<String> {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getStringSet(KEY_AUTHORIZED_EMAILS, emptySet()) ?: emptySet()
        }
    }
}
