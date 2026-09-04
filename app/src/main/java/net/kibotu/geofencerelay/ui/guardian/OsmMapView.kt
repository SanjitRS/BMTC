package net.kibotu.geofencerelay.ui.guardian

import android.content.Context
import android.graphics.Color
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import net.kibotu.geofencerelay.R
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon

@Composable
fun OsmMapView(
    modifier: Modifier = Modifier,
    zone: GeofenceZone,
    targetPing: LocationPing?,
    isBreached: Boolean,
    recenterTrigger: Int = 0,
    onMapTapped: (latitude: Double, longitude: Double) -> Unit
) {
    val context = LocalContext.current

    // Initialize osmdroid configuration with persistent preferences and compliant User-Agent
    remember {
        val prefs = context.getSharedPreferences("${context.packageName}_osm", Context.MODE_PRIVATE)
        Configuration.getInstance().load(context, prefs)
        Configuration.getInstance().userAgentValue = "${context.packageName}/1.0 (Android; BMTC-GeofenceRelay)"
        true
    }

    val defaultCenter = remember { GeoPoint(12.9716, 77.5946) } // Bengaluru / BMTC default

    val mapView = remember {
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            controller.setZoom(16.5)

            val initialCenter = when {
                targetPing != null && targetPing.latitude != 0.0 && targetPing.longitude != 0.0 -> {
                    GeoPoint(targetPing.latitude, targetPing.longitude)
                }
                zone.latitude != 0.0 && zone.longitude != 0.0 -> {
                    GeoPoint(zone.latitude, zone.longitude)
                }
                else -> defaultCenter
            }
            controller.setCenter(initialCenter)
        }
    }

    DisposableEffect(Unit) {
        mapView.onResume()
        onDispose {
            mapView.onPause()
        }
    }

    // Auto-center camera onto target location or safe zone whenever coordinates change or recenter is clicked
    LaunchedEffect(targetPing?.latitude, targetPing?.longitude, zone.latitude, zone.longitude, recenterTrigger) {
        val destination = when {
            targetPing != null && targetPing.latitude != 0.0 && targetPing.longitude != 0.0 -> {
                GeoPoint(targetPing.latitude, targetPing.longitude)
            }
            zone.latitude != 0.0 && zone.longitude != 0.0 -> {
                GeoPoint(zone.latitude, zone.longitude)
            }
            else -> null
        }

        if (destination != null) {
            mapView.post {
                try {
                    mapView.controller.animateTo(destination)
                } catch (_: Exception) {
                    mapView.controller.setCenter(destination)
                }
            }
        }
    }

    // Persistent overlays to prevent flickering and overlay churn
    val circleOverlay = remember { Polygon(mapView) }
    val centerMarker = remember {
        Marker(mapView).apply {
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        }
    }
    val targetMarker = remember {
        Marker(mapView).apply {
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            val icon = ContextCompat.getDrawable(context, R.drawable.ic_location_marker)
            if (icon != null) {
                this.icon = icon
            }
        }
    }

    AndroidView(
        modifier = modifier,
        factory = {
            mapView.apply {
                // Use Osmdroid's dedicated MapEventsOverlay for pixel-accurate tap-to-coordinate mapping
                val mapEventsReceiver = object : MapEventsReceiver {
                    override fun singleTapConfirmedHelper(p: GeoPoint): Boolean {
                        onMapTapped(p.latitude, p.longitude)
                        return true
                    }
                    override fun longPressHelper(p: GeoPoint): Boolean = false
                }
                overlays.add(MapEventsOverlay(mapEventsReceiver))
            }
        },
        update = { view ->
            // 1. Draw Safe Zone Circle if valid coordinates
            if (zone.latitude != 0.0 && zone.longitude != 0.0) {
                val circlePoints = Polygon.pointsAsCircle(
                    GeoPoint(zone.latitude, zone.longitude),
                    zone.radiusMeters
                )
                circleOverlay.points = circlePoints
                val stroke = if (isBreached) Color.RED else Color.rgb(16, 185, 129)
                val fill = if (isBreached) Color.argb(45, 239, 68, 68) else Color.argb(45, 16, 185, 129)
                // Set colors via native Osmdroid properties so Polygon.draw() does not override them
                circleOverlay.strokeColor = stroke
                circleOverlay.fillColor = fill
                circleOverlay.strokeWidth = 6f

                if (!view.overlays.contains(circleOverlay)) {
                    view.overlays.add(circleOverlay)
                }

                // 2. Safe Zone Center Marker
                centerMarker.position = GeoPoint(zone.latitude, zone.longitude)
                centerMarker.title = "🛡️ ${zone.name}"
                centerMarker.snippet = "Radius: ${zone.radiusMeters.toInt()}m"

                if (!view.overlays.contains(centerMarker)) {
                    view.overlays.add(centerMarker)
                }
            } else {
                view.overlays.remove(circleOverlay)
                view.overlays.remove(centerMarker)
            }

            // 3. Draw Tracked Device Marker (Find My style)
            if (targetPing != null && targetPing.latitude != 0.0 && targetPing.longitude != 0.0) {
                targetMarker.position = GeoPoint(targetPing.latitude, targetPing.longitude)
                targetMarker.title = if (isBreached) "🚨 ${targetPing.deviceName} (BREACHED)" else "📍 ${targetPing.deviceName}"
                targetMarker.snippet = "${targetPing.address} | ${targetPing.batteryLevel}% 🔋"

                val markerDrawableRes = if (isBreached) R.drawable.ic_breach_alert else R.drawable.ic_location_marker
                val markerDrawable = ContextCompat.getDrawable(context, markerDrawableRes)
                if (markerDrawable != null) {
                    targetMarker.icon = markerDrawable
                }

                if (!view.overlays.contains(targetMarker)) {
                    view.overlays.add(targetMarker)
                }
            } else {
                view.overlays.remove(targetMarker)
            }

            view.invalidate()
        }
    )
}
