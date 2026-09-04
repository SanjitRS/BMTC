package net.kibotu.geofencerelay.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Blue500,
    secondary = Emerald500,
    tertiary = Amber500,
    background = Slate900,
    surface = Slate800,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Gray200,
    onSurface = Color.White,
    error = Red500
)

@Composable
fun GeofenceRelayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
