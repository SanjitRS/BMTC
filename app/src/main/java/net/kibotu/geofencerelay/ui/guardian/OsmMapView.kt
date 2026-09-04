package net.kibotu.geofencerelay.ui.guardian

import android.graphics.Color
import android.graphics.Paint
import android.view.MotionEvent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import net.kibotu.geofencerelay.model.GeofenceZone
import net.kibotu.geofencerelay.model.LocationPing
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Overlay
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
    Configuration.getInstance().userAgentValue = context.packageName

    val mapView = remember {
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            controller.setZoom(16.5)
            if (zone.latitude != 0.0) {
                controller.setCenter(GeoPoint(zone.latitude, zone.longitude))
            }
        }
    }

    DisposableEffect(Unit) {
        mapView.onResume()
        onDispose {
            mapView.onPause()
        }
    }

    // Auto-center camera onto target location whenever targetPing arrives or recenter is clicked
    LaunchedEffect(targetPing?.latitude, targetPing?.longitude, recenterTrigger) {
        if (targetPing != null && targetPing.latitude != 0.0 && targetPing.longitude != 0.0) {
            val targetPoint = GeoPoint(targetPing.latitude, targetPing.longitude)
            mapView.controller.animateTo(targetPoint)
        }
    }

    AndroidView(
        modifier = modifier,
        factory = {
            mapView.apply {
                overlays.add(object : Overlay() {
                    override fun onSingleTapConfirmed(e: MotionEvent?, mapView: MapView?): Boolean {
                        if (e != null && mapView != null) {
                            val projection = mapView.projection
                            val geoPoint = projection.fromPixels(e.x.toInt(), e.y.toInt()) as? GeoPoint
                            if (geoPoint != null) {
                                onMapTapped(geoPoint.latitude, geoPoint.longitude)
                                return true
                            }
                        }
                        return false
                    }
                })
            }
        },
        update = { view ->
            // Clear dynamic markers and polygon overlays
            val nonTapOverlays = view.overlays.filterIsInstance<Overlay>().filter {
                it !is Polygon && it !is Marker
            }
            view.overlays.clear()
            view.overlays.addAll(nonTapOverlays)

            // 1. Draw Safe Zone Circle if valid coordinates
            if (zone.latitude != 0.0 && zone.longitude != 0.0) {
                val circlePoints = Polygon.pointsAsCircle(
                    GeoPoint(zone.latitude, zone.longitude),
                    zone.radiusMeters
                )
                val circleOverlay = Polygon(view).apply {
                    points = circlePoints
                    val strokeColor = if (isBreached) Color.RED else Color.rgb(16, 185, 129)
                    val fillColor = if (isBreached) Color.argb(45, 239, 68, 68) else Color.argb(45, 16, 185, 129)
                    outlinePaint.color = strokeColor
                    outlinePaint.strokeWidth = 6f
                    fillPaint.color = fillColor
                    fillPaint.style = Paint.Style.FILL
                }
                view.overlays.add(circleOverlay)

                // 2. Safe Zone Center Marker
                val centerMarker = Marker(view).apply {
                    position = GeoPoint(zone.latitude, zone.longitude)
                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                    title = "??? ${zone.name}"
                    snippet = "Radius: ${zone.radiusMeters.toInt()}m"
                }
                view.overlays.add(centerMarker)
            }

            // 3. Draw Tracked Device Marker (Find My style)
            if (targetPing != null && targetPing.latitude != 0.0) {
                val targetMarker = Marker(view).apply {
                    position = GeoPoint(targetPing.latitude, targetPing.longitude)
                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                    title = if (isBreached) "?? ${targetPing.deviceName} (BREACHED)" else "?? ${targetPing.deviceName}"
                    snippet = "${targetPing.address} | ${targetPing.batteryLevel}% ??"
                }
                view.overlays.add(targetMarker)
            }

            view.invalidate()
        }
    )
}
