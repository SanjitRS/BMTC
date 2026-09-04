package net.kibotu.geofencerelay.util

import android.content.Context
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import net.kibotu.geofencerelay.model.GeofenceZone
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

object LocationUtils {

    fun distanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return results[0].toDouble()
    }

    fun isInsideZone(latitude: Double, longitude: Double, zone: GeofenceZone?): Boolean {
        if (zone == null) return true
        val distance = distanceMeters(latitude, longitude, zone.latitude, zone.longitude)
        return distance <= zone.radiusMeters
    }

    suspend fun getReadableAddress(context: Context, latitude: Double, longitude: Double): String = withContext(Dispatchers.IO) {
        if (latitude == 0.0 && longitude == 0.0) return@withContext "Unknown location"
        try {
            val geocoder = Geocoder(context, Locale.getDefault())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                var addressResult = "Near current position"
                val addresses = geocoder.getFromLocation(latitude, longitude, 1)
                if (!addresses.isNullOrEmpty()) {
                    val addr: Address = addresses[0]
                    val feature = addr.thoroughfare ?: addr.subLocality ?: addr.locality ?: addr.featureName
                    val city = addr.locality ?: addr.adminArea ?: ""
                    addressResult = if (!feature.isNullOrBlank()) "$feature, $city".trim().removeSuffix(",") else city
                }
                addressResult
            } else {
                @Suppress("DEPRECATION")
                val addresses = geocoder.getFromLocation(latitude, longitude, 1)
                if (!addresses.isNullOrEmpty()) {
                    val addr = addresses[0]
                    val feature = addr.thoroughfare ?: addr.subLocality ?: addr.locality ?: addr.featureName
                    val city = addr.locality ?: addr.adminArea ?: ""
                    if (!feature.isNullOrBlank()) "$feature, $city".trim().removeSuffix(",") else city
                } else {
                    "Near current position"
                }
            }
        } catch (_: Exception) {
            "%.4f, %.4f".format(Locale.US, latitude, longitude)
        }
    }

    fun formatDistance(meters: Double): String {
        return if (meters >= 1000) {
            String.format(Locale.getDefault(), "%.2f km", meters / 1000)
        } else {
            String.format(Locale.getDefault(), "%d m", meters.roundToInt())
        }
    }

    fun formatSpeed(speedMps: Float): String {
        val kmh = speedMps * 3.6f
        return String.format(Locale.getDefault(), "%.1f km/h", kmh)
    }

    fun formatTime(timestamp: Long): String {
        val diffSeconds = (System.currentTimeMillis() - timestamp) / 1000
        return when {
            diffSeconds < 10 -> "Just now"
            diffSeconds < 60 -> "${diffSeconds}s ago"
            diffSeconds < 3600 -> "${diffSeconds / 60}m ago"
            else -> {
                val sdf = SimpleDateFormat("h:mm a", Locale.getDefault())
                sdf.format(Date(timestamp))
            }
        }
    }
}
