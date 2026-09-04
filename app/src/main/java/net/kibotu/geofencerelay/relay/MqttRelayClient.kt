package net.kibotu.geofencerelay.relay

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import net.kibotu.geofencerelay.model.BreachAlert
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import net.kibotu.geofencerelay.model.RemoteCommand
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.UUID

class MqttRelayClient(
    private val brokerUrl: String = "tcp://broker.hivemq.com:1883"
) : RelayClient {

    private val tag = "FindMyMqtt"
    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var client: MqttClient? = null
    private var currentUserEmail: String = ""

    private val _isConnected = MutableStateFlow(false)
    override val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _activeZone = MutableStateFlow<GeofenceZone?>(null)
    override val activeZone: StateFlow<GeofenceZone?> = _activeZone.asStateFlow()

    private val _latestPing = MutableSharedFlow<LocationPing>(extraBufferCapacity = 64)
    override val latestPing: SharedFlow<LocationPing> = _latestPing.asSharedFlow()

    private val _breachAlert = MutableSharedFlow<BreachAlert>(extraBufferCapacity = 32)
    override val breachAlert: SharedFlow<BreachAlert> = _breachAlert.asSharedFlow()

    private val _incomingCommand = MutableSharedFlow<RemoteCommand>(extraBufferCapacity = 16)
    override val incomingCommand: SharedFlow<RemoteCommand> = _incomingCommand.asSharedFlow()

    fun sanitizeEmail(email: String): String {
        return email.trim().lowercase()
            .replace("@", "_at_")
            .replace(".", "_")
            .replace("+", "_")
    }

    override suspend fun connect(userEmail: String): Boolean = withContext(Dispatchers.IO) {
        currentUserEmail = userEmail
        try {
            disconnect()
            val clientId = "findmy_${UUID.randomUUID().toString().take(8)}"
            val mqttClient = MqttClient(brokerUrl, clientId, MemoryPersistence())
            client = mqttClient

            mqttClient.setCallback(object : MqttCallbackExtended {
                override fun connectComplete(reconnect: Boolean, serverURI: String?) {
                    Log.d(tag, "Connected to relay (reconnect=$reconnect)")
                    _isConnected.value = true
                    subscribeForEmail(currentUserEmail)
                }

                override fun connectionLost(cause: Throwable?) {
                    Log.w(tag, "Connection lost: ${cause?.message}")
                    _isConnected.value = false
                }

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    val payload = message?.payload?.let { String(it) } ?: return
                    handleIncomingMessage(topic ?: "", payload)
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {}
            })

            val options = MqttConnectOptions().apply {
                isAutomaticReconnect = true
                isCleanSession = true
                connectionTimeout = 10
                keepAliveInterval = 30
            }

            mqttClient.connect(options)
            true
        } catch (e: Exception) {
            Log.e(tag, "Failed to connect: ${e.message}", e)
            _isConnected.value = false
            false
        }
    }

    fun subscribeForEmail(email: String) {
        val c = client ?: return
        if (!c.isConnected) return
        val sanitized = sanitizeEmail(email)
        val baseTopic = "findmy/v1/$sanitized"
        try {
            c.subscribe("$baseTopic/+/location", 0)
            c.subscribe("$baseTopic/+/zone", 1)
            c.subscribe("$baseTopic/+/alert", 1)
            c.subscribe("$baseTopic/+/command", 1)
            Log.d(tag, "Subscribed to topics for Google Account: $email ($sanitized)")
        } catch (e: Exception) {
            Log.e(tag, "Subscribe error: ${e.message}", e)
        }
    }

    private fun handleIncomingMessage(topic: String, payload: String) {
        scope.launch {
            try {
                when {
                    topic.endsWith("/location") -> {
                        val ping = json.decodeFromString<LocationPing>(payload)
                        _latestPing.tryEmit(ping)
                        Log.v(tag, "Received location from ${ping.deviceName}: ${ping.latitude}, ${ping.longitude}")
                    }
                    topic.endsWith("/zone") -> {
                        val zone = json.decodeFromString<GeofenceZone>(payload)
                        _activeZone.value = zone
                        Log.d(tag, "Received geofence zone: ${zone.name} (r=${zone.radiusMeters}m)")
                    }
                    topic.endsWith("/alert") -> {
                        val alert = json.decodeFromString<BreachAlert>(payload)
                        _breachAlert.tryEmit(alert)
                    }
                    topic.endsWith("/command") -> {
                        val cmd = json.decodeFromString<RemoteCommand>(payload)
                        _incomingCommand.tryEmit(cmd)
                        Log.d(tag, "Received remote command: ${cmd.command}")
                    }
                }
            } catch (e: Exception) {
                Log.e(tag, "Error parsing incoming payload on $topic: ${e.message}")
            }
        }
    }

    override suspend fun publishZone(targetEmail: String, zone: GeofenceZone): Boolean = withContext(Dispatchers.IO) {
        val topic = "findmy/v1/${sanitizeEmail(targetEmail)}/${zone.id}/zone"
        val payload = json.encodeToString(zone)
        publishInternal(topic, payload, qos = 1, retained = true)
    }

    override suspend fun publishPing(targetEmail: String, ping: LocationPing): Boolean = withContext(Dispatchers.IO) {
        val topic = "findmy/v1/${sanitizeEmail(targetEmail)}/${ping.deviceId}/location"
        val payload = json.encodeToString(ping)
        publishInternal(topic, payload, qos = 0, retained = false)
    }

    override suspend fun publishAlert(targetEmail: String, alert: BreachAlert): Boolean = withContext(Dispatchers.IO) {
        val topic = "findmy/v1/${sanitizeEmail(targetEmail)}/${alert.deviceId}/alert"
        val payload = json.encodeToString(alert)
        publishInternal(topic, payload, qos = 1, retained = false)
    }

    override suspend fun sendCommand(targetEmail: String, deviceId: String, command: RemoteCommand): Boolean = withContext(Dispatchers.IO) {
        val topic = "findmy/v1/${sanitizeEmail(targetEmail)}/$deviceId/command"
        val payload = json.encodeToString(command)
        publishInternal(topic, payload, qos = 1, retained = false)
    }

    private fun publishInternal(topic: String, payload: String, qos: Int, retained: Boolean): Boolean {
        val c = client ?: return false
        return try {
            if (c.isConnected) {
                val message = MqttMessage(payload.toByteArray()).apply {
                    this.qos = qos
                    this.isRetained = retained
                }
                c.publish(topic, message)
                true
            } else {
                Log.w(tag, "Cannot publish to $topic: disconnected")
                false
            }
        } catch (e: Exception) {
            Log.e(tag, "Publish failed: ${e.message}", e)
            false
        }
    }

    override fun disconnect() {
        try {
            client?.let {
                if (it.isConnected) it.disconnect()
                it.close()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error disconnecting: ${e.message}")
        } finally {
            client = null
            _isConnected.value = false
        }
    }

    companion object {
        val shared: MqttRelayClient by lazy { MqttRelayClient() }
    }
}
