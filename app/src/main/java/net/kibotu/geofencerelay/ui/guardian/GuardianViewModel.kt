package net.kibotu.geofencerelay.ui.guardian

import android.annotation.SuppressLint
import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.kibotu.geofencerelay.model.BreachAlert
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import net.kibotu.geofencerelay.model.RemoteCommand
import net.kibotu.geofencerelay.relay.MqttRelayClient
import net.kibotu.geofencerelay.util.BatteryUtils
import net.kibotu.geofencerelay.util.LocationUtils
import net.kibotu.geofencerelay.util.SoundPlayer
import java.util.UUID

class GuardianViewModel(application: Application) : AndroidViewModel(application) {

    private val relay = MqttRelayClient.shared
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(application)

    val isConnected = relay.isConnected
    private var guardianEmail: String = ""

    // Default to a sensible location (e.g. Bangalore or Mountain View) until GPS fix arrives
    private val _zone = MutableStateFlow(
        GeofenceZone(
            id = UUID.randomUUID().toString().take(8),
            name = "My Safe Zone",
            latitude = 12.9716,
            longitude = 77.5946,
            radiusMeters = 300.0
        )
    )
    val zone = _zone.asStateFlow()

    private val _targetPing = MutableStateFlow<LocationPing?>(null)
    val targetPing = _targetPing.asStateFlow()

    private val _latestAlert = MutableStateFlow<BreachAlert?>(null)
    val latestAlert = _latestAlert.asStateFlow()

    private val _isBreached = MutableStateFlow(false)
    val isBreached = _isBreached.asStateFlow()

    private val _broadcastSuccess = MutableStateFlow(false)
    val broadcastSuccess = _broadcastSuccess.asStateFlow()

    private val _recenterTrigger = MutableStateFlow(0)
    val recenterTrigger = _recenterTrigger.asStateFlow()

    private val _isPlayingSound = MutableStateFlow(false)
    val isPlayingSound = _isPlayingSound.asStateFlow()

    private var isSimulatingBreach = false

    init {
        acquireLocalGpsFix()
    }

    @SuppressLint("MissingPermission")
    fun acquireLocalGpsFix() {
        viewModelScope.launch {
            try {
                val cts = CancellationTokenSource()
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token)
                    .addOnSuccessListener { loc ->
                        if (loc != null) {
                            applyDeviceLocation(loc.latitude, loc.longitude, loc.accuracy)
                        } else {
                            fusedLocationClient.lastLocation.addOnSuccessListener { last ->
                                if (last != null) {
                                    applyDeviceLocation(last.latitude, last.longitude, last.accuracy)
                                }
                            }
                        }
                    }
            } catch (_: Exception) {}
        }
    }

    private fun applyDeviceLocation(lat: Double, lon: Double, accuracy: Float) {
        viewModelScope.launch {
            val app = getApplication<Application>()
            val battery = BatteryUtils.getBatteryStatus(app)
            val address = LocationUtils.getReadableAddress(app, lat, lon)

            // Center safe zone on real device location
            _zone.value = _zone.value.copy(
                latitude = lat,
                longitude = lon
            )

            // Populate initial device ping so UI immediately shows this device's location
            if (_targetPing.value == null) {
                _targetPing.value = LocationPing(
                    deviceId = "local_device",
                    deviceName = Build.MODEL ?: "This Device",
                    latitude = lat,
                    longitude = lon,
                    accuracy = accuracy,
                    batteryLevel = battery.level,
                    isCharging = battery.isCharging,
                    address = address,
                    isBreach = false,
                    distanceFromCenter = 0.0,
                    timestamp = System.currentTimeMillis()
                )
                triggerRecenter()
            }
        }
    }

    fun init(email: String) {
        guardianEmail = email.trim().lowercase()
        viewModelScope.launch {
            relay.connect(guardianEmail)

            // Listen for active zone
            launch {
                relay.activeZone.collect { existingZone ->
                    if (existingZone != null && existingZone.latitude != 0.0) {
                        _zone.value = existingZone
                    }
                }
            }

            // Listen for live location pings from remote target
            launch {
                relay.latestPing.collect { ping ->
                    if (!isSimulatingBreach) {
                        _targetPing.value = ping
                        _isBreached.value = ping.isBreach
                        if (_zone.value.latitude == 0.0 && ping.latitude != 0.0) {
                            _zone.value = _zone.value.copy(
                                latitude = ping.latitude,
                                longitude = ping.longitude
                            )
                        }
                    }
                }
            }

            // Listen for breach alerts
            launch {
                relay.breachAlert.collect { alert ->
                    if (!isSimulatingBreach) {
                        _latestAlert.value = alert
                        _isBreached.value = alert.status != "RESOLVED_INSIDE"
                    }
                }
            }
        }
    }

    fun updateCenter(lat: Double, lon: Double) {
        _zone.value = _zone.value.copy(
            latitude = lat,
            longitude = lon,
            updatedAt = System.currentTimeMillis()
        )
    }

    fun updateRadius(radius: Double) {
        _zone.value = _zone.value.copy(
            radiusMeters = radius,
            updatedAt = System.currentTimeMillis()
        )
    }

    fun updateName(name: String) {
        _zone.value = _zone.value.copy(
            name = name,
            updatedAt = System.currentTimeMillis()
        )
    }

    fun broadcastZone() {
        viewModelScope.launch {
            val success = relay.publishZone(guardianEmail, _zone.value)
            _broadcastSuccess.value = success
        }
    }

    fun triggerRecenter() {
        _recenterTrigger.value += 1
    }

    fun playSound() {
        _isPlayingSound.value = true
        SoundPlayer.playFindMySound(getApplication())
        val deviceId = _targetPing.value?.deviceId
        if (!deviceId.isNullOrEmpty() && guardianEmail.isNotEmpty()) {
            viewModelScope.launch {
                relay.sendCommand(
                    targetEmail = guardianEmail,
                    deviceId = deviceId,
                    command = RemoteCommand("PLAY_SOUND", guardianEmail)
                )
            }
        }
    }

    fun stopSound() {
        _isPlayingSound.value = false
        SoundPlayer.stopSound()
        val deviceId = _targetPing.value?.deviceId
        if (!deviceId.isNullOrEmpty() && guardianEmail.isNotEmpty()) {
            viewModelScope.launch {
                relay.sendCommand(
                    targetEmail = guardianEmail,
                    deviceId = deviceId,
                    command = RemoteCommand("STOP_SOUND", guardianEmail)
                )
            }
        }
    }

    fun toggleBreachSimulation() {
        isSimulatingBreach = !isSimulatingBreach
        val current = _targetPing.value ?: return
        val z = _zone.value

        if (isSimulatingBreach) {
            // Move target 450m outside the safe zone
            val offsetLat = z.latitude + 0.0040 // ~450 meters north
            val offsetLon = z.longitude + 0.0030
            val dist = LocationUtils.distanceMeters(offsetLat, offsetLon, z.latitude, z.longitude)

            _isBreached.value = true
            _targetPing.value = current.copy(
                latitude = offsetLat,
                longitude = offsetLon,
                isBreach = true,
                speed = 4.2f, // 15 km/h
                distanceFromCenter = dist,
                address = "Outside Safe Zone Boundary",
                timestamp = System.currentTimeMillis()
            )
            _latestAlert.value = BreachAlert(
                deviceId = current.deviceId,
                geofenceName = z.name,
                distanceMeters = dist,
                status = "BREACH_STARTED"
            )
            triggerRecenter()
            playSound()
        } else {
            // Return back inside safe zone
            _isBreached.value = false
            _targetPing.value = current.copy(
                latitude = z.latitude,
                longitude = z.longitude,
                isBreach = false,
                speed = 0f,
                distanceFromCenter = 0.0,
                address = "Inside ${z.name}",
                timestamp = System.currentTimeMillis()
            )
            _latestAlert.value = null
            stopSound()
            triggerRecenter()
        }
    }
}
