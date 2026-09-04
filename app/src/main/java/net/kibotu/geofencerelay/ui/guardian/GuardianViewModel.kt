package net.kibotu.geofencerelay.ui.guardian

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.kibotu.geofencerelay.model.BreachAlert
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import net.kibotu.geofencerelay.model.RemoteCommand
import net.kibotu.geofencerelay.relay.MqttRelayClient
import java.util.UUID

class GuardianViewModel : ViewModel() {

    private val relay = MqttRelayClient.shared

    val isConnected = relay.isConnected

    private var guardianEmail: String = ""

    private val _zone = MutableStateFlow(
        GeofenceZone(
            id = UUID.randomUUID().toString().take(8),
            name = "Designated Safe Zone",
            latitude = 0.0,
            longitude = 0.0,
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

            // Listen for live location pings
            launch {
                relay.latestPing.collect { ping ->
                    _targetPing.value = ping
                    _isBreached.value = ping.isBreach

                    // If zone not yet configured, automatically center safe zone around target device's real location!
                    if (_zone.value.latitude == 0.0 && ping.latitude != 0.0) {
                        _zone.value = _zone.value.copy(
                            latitude = ping.latitude,
                            longitude = ping.longitude
                        )
                    }
                }
            }

            // Listen for breach alerts
            launch {
                relay.breachAlert.collect { alert ->
                    _latestAlert.value = alert
                    _isBreached.value = alert.status != "RESOLVED_INSIDE"
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
        val deviceId = _targetPing.value?.deviceId ?: return
        viewModelScope.launch {
            _isPlayingSound.value = true
            relay.sendCommand(
                targetEmail = guardianEmail,
                deviceId = deviceId,
                command = RemoteCommand("PLAY_SOUND", guardianEmail)
            )
        }
    }

    fun stopSound() {
        val deviceId = _targetPing.value?.deviceId ?: return
        viewModelScope.launch {
            _isPlayingSound.value = false
            relay.sendCommand(
                targetEmail = guardianEmail,
                deviceId = deviceId,
                command = RemoteCommand("STOP_SOUND", guardianEmail)
            )
        }
    }

    fun dismissAlert() {
        _latestAlert.value = null
    }
}
