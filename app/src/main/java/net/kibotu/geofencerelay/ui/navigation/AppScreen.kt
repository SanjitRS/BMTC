package net.kibotu.geofencerelay.ui.navigation

sealed class AppScreen {
    object Home : AppScreen()
    data class Guardian(val googleEmail: String) : AppScreen()
    object Tracker : AppScreen()
}
