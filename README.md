# Geofence Sentinel & Real-Time Relay System

A modern Android application built in Kotlin, Jetpack Compose, and OpenStreetMap that implements a dual-role geofence monitoring and breach relay system.

- **100% Free & Open Source**: No Google Cloud API billing, no Firebase accounts, and no paid subscriptions.
- **Instant Cloud Relay**: Uses a public MQTT pub/sub broker (`broker.hivemq.com`) for instantaneous real-time bidirectional syncing.
- **Power-Aware GPS Sentinel**: Operates in low-power mode while inside the designated safe zone, and immediately fires up a high-frequency Android Foreground Service with live GPS streaming upon boundary breach.

---

## Architecture Overview

```
[ Guardian / Controller Device ]
               |
               | 1. Broadcasts Safe Zone {Lat, Lon, Radius, Name}
               v
  +--------------------------+
  | Public MQTT Relay Broker |  <-- 100% Free, zero-setup broker
  +--------------------------+
               ^             |
               |             | 2. Syncs Safe Zone Config
               |             v
               |   [ Tracked Target Device ]
               |      - Calculates geodetic distance to center
               |      - Inside Zone: Low-power idle
               |      - OUTSIDE ZONE (Breach Transition):
               |        * Starts Foreground Location Service
               |        * Triggers Heads-Up System Notification
               |        * Streams live GPS coordinates every 3s
               |
               | 3. Relays Live GPS Telemetry & Breach Alarms
               v
[ Guardian / Controller Device ]
  - Flashes ?? BREACH ALERT banner
  - Shows live moving target marker on OpenStreetMap with speed & distance
```

---

## Features

### ??? Controller / Guardian Mode
- **Interactive OpenStreetMap**: Visualizes the safe zone as a circular overlay (green when secure, red when breached).
- **Tap to Reposition**: Tap anywhere on the map to set the geofence center.
- **Configurable Radius**: Interactive slider from 50m to 2000m.
- **One-Tap Broadcast**: Immediately syncs the geofence to the tracked device over the shared channel.
- **Live Target Radar**: Shows the target's live location, distance from center, speed in km/h, and status.

### ?? Tracked Target Device Mode
- **Background Sentinel**: Runs as an Android Foreground Service with ongoing notification (`FOREGROUND_SERVICE_TYPE_LOCATION`), surviving app minimizes and screen locks.
- **Auto-Reboot Recovery**: `BootReceiver` restarts the sentinel automatically if the phone restarts.
- **Intelligent Frequency Switching**:
  - *Inside zone*: updates every 12-15 seconds to preserve battery.
  - *Outside zone*: escalates to high-frequency 3-second updates with `PRIORITY_HIGH_ACCURACY`.
- **Automatic Return Detection**: Once the user steps back inside the boundary, it sends a `RESOLVED_INSIDE` alert and throttles down.

---

## How to Run in Android Studio

1. **Open Android Studio**:
   - Select **File > Open...**
   - Navigate to:
     ```
     C:\Users\creat\.gemini\antigravity\scratch\geofence_relay_app
     ```
   - Click **OK** to import the project.

2. **Gradle Sync**:
   - Android Studio will automatically download the necessary dependencies and sync the Gradle build.

3. **Run on Two Devices or Emulators**:
   - You can run the app on **two emulators** or **one emulator and one physical phone**.
   - Set the same **Pairing Channel ID** (e.g. `family-safe-zone`) on both.
   - On Phone/Emulator 1: Launch **Guardian / Controller Mode**.
   - On Phone/Emulator 2: Launch **Tracked Target Device Mode** and grant location permissions.

4. **Simulate Geofence Breach**:
   - On the Guardian app: Tap the map to set the safe zone and tap **Broadcast Safe Zone**.
   - On the Tracked device emulator:
     - Open Emulator **Extended Controls** (`...` icon on emulator toolbar) > **Location**.
     - Send coordinates *inside* the circle: Status stays **?? SECURE**.
     - Send coordinates *outside* the circle: Instantly triggers **?? BREACH DETECTED!**, notifications fire, and the Guardian map shows the pin moving in real time!
