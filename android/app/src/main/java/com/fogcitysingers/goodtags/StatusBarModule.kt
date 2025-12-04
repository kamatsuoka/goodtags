package com.fogcitysingers.goodtags

import android.view.View
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class StatusBarModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "StatusBarModule"
    }

    @ReactMethod
    fun setHidden(hidden: Boolean) {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            val window = activity.window
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            
            if (hidden) {
                controller?.hide(WindowInsetsCompat.Type.statusBars())
            } else {
                controller?.show(WindowInsetsCompat.Type.statusBars())
            }
            
            // Ensure we maintain edge-to-edge mode
            WindowCompat.setDecorFitsSystemWindows(window, false)
        }
    }
}
