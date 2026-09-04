package net.kibotu.geofencerelay.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import net.kibotu.geofencerelay.ui.guardian.GuardianScreen
import net.kibotu.geofencerelay.ui.home.HomeScreen
import net.kibotu.geofencerelay.ui.navigation.AppScreen
import net.kibotu.geofencerelay.ui.theme.GeofenceRelayTheme
import net.kibotu.geofencerelay.ui.tracker.TrackerScreen
import net.kibotu.geofencerelay.util.NotificationHelper

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NotificationHelper.createNotificationChannels(this)

        setContent {
            GeofenceRelayTheme {
                var currentScreen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }

                when (val screen = currentScreen) {
                    is AppScreen.Home -> {
                        HomeScreen(
                            onSelectGuardian = { email ->
                                currentScreen = AppScreen.Guardian(email)
                            },
                            onSelectTracker = {
                                currentScreen = AppScreen.Tracker
                            }
                        )
                    }
                    is AppScreen.Guardian -> {
                        BackHandler {
                            currentScreen = AppScreen.Home
                        }
                        GuardianScreen(
                            googleAccountEmail = screen.googleEmail,
                            onBack = { currentScreen = AppScreen.Home }
                        )
                    }
                    is AppScreen.Tracker -> {
                        BackHandler {
                            currentScreen = AppScreen.Home
                        }
                        TrackerScreen(
                            onBack = { currentScreen = AppScreen.Home }
                        )
                    }
                }
            }
        }
    }
}
