package com.nulljosh.seamark

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

fun main() = application {
    Strings.language = java.util.Locale.getDefault().language
    Window(
        onCloseRequest = ::exitApplication,
        title = "Seamark",
        state = rememberWindowState(size = DpSize(980.dp, 640.dp)),
    ) {
        MaterialTheme { SeamarkScreen() }
    }
}
