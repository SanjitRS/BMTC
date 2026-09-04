package net.kibotu.geofencerelay.ui.guardian

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import net.kibotu.geofencerelay.ui.theme.Blue500
import net.kibotu.geofencerelay.ui.theme.Emerald500
import net.kibotu.geofencerelay.ui.theme.Red500
import net.kibotu.geofencerelay.ui.theme.Slate700
import net.kibotu.geofencerelay.ui.theme.Slate800
import net.kibotu.geofencerelay.ui.theme.Slate900
import net.kibotu.geofencerelay.util.LocationUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuardianScreen(
    googleAccountEmail: String,
    onBack: () -> Unit,
    vm: GuardianViewModel = viewModel()
) {
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        vm.acquireLocalGpsFix()
    }

    LaunchedEffect(Unit) {
        val fineLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (!fineLocation) {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        } else {
            vm.acquireLocalGpsFix()
        }
    }

    LaunchedEffect(googleAccountEmail) {
        vm.init(googleAccountEmail)
    }

    val isConnected by vm.isConnected.collectAsState()
    val zone by vm.zone.collectAsState()
    val targetPing by vm.targetPing.collectAsState()
    val latestAlert by vm.latestAlert.collectAsState()
    val isBreached by vm.isBreached.collectAsState()
    val broadcastSuccess by vm.broadcastSuccess.collectAsState()
    val recenterTrigger by vm.recenterTrigger.collectAsState()
    val isPlayingSound by vm.isPlayingSound.collectAsState()

    var showZoneEditor by remember { mutableStateOf(false) }
    var sliderRadius by remember(zone.radiusMeters) {
        mutableFloatStateOf(zone.radiusMeters.toFloat())
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Find My Device", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text(
                            "Google: $googleAccountEmail",
                            fontSize = 12.sp,
                            color = Color(0xFFA5B4FC)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    Box(
                        modifier = Modifier
                            .padding(end = 12.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isConnected) Emerald500 else Red500)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (isConnected) "ONLINE" else "CONNECTING",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Slate900)
        ) {
            // Full Screen Interactive Map
            OsmMapView(
                modifier = Modifier.fillMaxSize(),
                zone = zone,
                targetPing = targetPing,
                isBreached = isBreached,
                recenterTrigger = recenterTrigger,
                onMapTapped = { lat, lon ->
                    if (showZoneEditor) {
                        vm.updateCenter(lat, lon)
                    }
                }
            )

            // Breach Banner across top of map
            AnimatedVisibility(
                visible = isBreached || latestAlert != null,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(8.dp),
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Red500),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("?? SAFE ZONE BREACH DETECTED!", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                            Text(
                                "Device is outside '${zone.name}' (${LocationUtils.formatDistance(targetPing?.distanceFromCenter ?: 0.0)} away).",
                                color = Color.White,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Floating Map Controls (Recenter Button)
            FloatingActionButton(
                onClick = { vm.triggerRecenter() },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 310.dp, end = 16.dp),
                containerColor = Slate800,
                contentColor = Blue500,
                shape = CircleShape
            ) {
                Icon(Icons.Default.GpsFixed, contentDescription = "Recenter on Device")
            }

            // Find My Bottom Sheet Card
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Drawer Handle
                    Box(
                        modifier = Modifier
                            .size(36.dp, 4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Slate700)
                            .align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Device Header Info
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = targetPing?.deviceName ?: "Locating Device...",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = targetPing?.address ?: "Acquiring GPS...",
                                fontSize = 13.sp,
                                color = Color.LightGray,
                                maxLines = 1
                            )
                        }

                        // Battery and status badges
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (targetPing != null) {
                                Icon(
                                    imageVector = if (targetPing!!.isCharging) Icons.Default.BatteryChargingFull else Icons.Default.BatteryFull,
                                    contentDescription = "Battery",
                                    tint = if (targetPing!!.batteryLevel <= 20) Red500 else Emerald500,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "${targetPing!!.batteryLevel}%",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isBreached) Red500 else Emerald500)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = if (isBreached) "BREACHED" else "SAFE",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Telemetry row: distance, speed, last seen
                    if (targetPing != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Dist: ${LocationUtils.formatDistance(targetPing!!.distanceFromCenter)}",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                            Text(
                                "Speed: ${LocationUtils.formatSpeed(targetPing!!.speed)}",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                            Text(
                                "Seen: ${LocationUtils.formatTime(targetPing!!.timestamp)}",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Quick Action Tiles
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // 1. Play Sound Button
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable {
                                if (isPlayingSound) vm.stopSound() else vm.playSound()
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(if (isPlayingSound) Red500 else Slate700),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Play Sound", tint = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(if (isPlayingSound) "Stop Sound" else "Play Sound", fontSize = 11.sp, color = Color.White)
                        }

                        // 2. Directions in Google Maps
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable {
                                val ping = targetPing
                                val lat = ping?.latitude ?: zone.latitude
                                val lon = ping?.longitude ?: zone.longitude
                                if (lat != 0.0 && lon != 0.0) {
                                    val uri = "google.navigation:q=$lat,$lon"
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
                                        setPackage("com.google.android.apps.maps")
                                    }
                                    try {
                                        context.startActivity(intent)
                                    } catch (_: Exception) {
                                        val webUri = "https://www.google.com/maps/dir/?api=1&destination=$lat,$lon"
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(webUri)))
                                    }
                                }
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(Blue500),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Directions, contentDescription = "Directions", tint = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Directions", fontSize = 11.sp, color = Color.White)
                        }

                        // 3. Safe Zone Setup Button
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable {
                                showZoneEditor = !showZoneEditor
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(if (showZoneEditor) Emerald500 else Slate700),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Security, contentDescription = "Safe Zone", tint = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Safe Zone", fontSize = 11.sp, color = Color.White)
                        }

                        // 4. Test Breach Simulation Button
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable {
                                vm.toggleBreachSimulation()
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(if (isBreached) Red500 else Color(0xFFF59E0B)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    if (isBreached) Icons.Default.Stop else Icons.Default.PlayArrow,
                                    contentDescription = "Test Breach",
                                    tint = Color.White
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(if (isBreached) "Reset Safe" else "Test Breach", fontSize = 11.sp, color = Color.White)
                        }
                    }

                    // Collapsible Safe Zone Editor
                    AnimatedVisibility(visible = showZoneEditor) {
                        Column(modifier = Modifier.padding(top = 16.dp)) {
                            Text(
                                "Configure Safe Geofence",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color.White
                            )
                            Text(
                                "Tap on map to place center. Set radius with slider below.",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Radius", color = Color.LightGray, fontSize = 13.sp)
                                Text("${sliderRadius.toInt()} meters", color = Emerald500, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }

                            Slider(
                                value = sliderRadius,
                                onValueChange = {
                                    sliderRadius = it
                                    vm.updateRadius(it.toDouble())
                                },
                                valueRange = 50f..2000f,
                                colors = SliderDefaults.colors(
                                    thumbColor = Emerald500,
                                    activeTrackColor = Emerald500
                                )
                            )

                            OutlinedTextField(
                                value = zone.name,
                                onValueChange = { vm.updateName(it) },
                                label = { Text("Zone Name (e.g. Home / Office)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Button(
                                onClick = { vm.broadcastZone() },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    if (broadcastSuccess) "Safe Zone Sent to Device! ?" else "Update Safe Zone on Device",
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
