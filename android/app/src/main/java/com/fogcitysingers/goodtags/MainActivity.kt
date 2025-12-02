package com.fogcitysingers.goodtags

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

import android.media.AudioManager
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "goodtags"

  // react-native-screens override -- see https://github.com/software-mansion/react-native-screens#android
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    
    // Set audio mode to NORMAL instead of COMMUNICATION to reduce audio subsystem overhead
    // Only switch to appropriate mode when audio playback is needed
    volumeControlStream = AudioManager.STREAM_MUSIC
    
    // Enable edge-to-edge display
    WindowCompat.setDecorFitsSystemWindows(window, false)
    
    // Make status bar transparent with light content
    window.statusBarColor = android.graphics.Color.TRANSPARENT
    
    // Make navigation bar transparent  
    window.navigationBarColor = android.graphics.Color.TRANSPARENT
    
    // Ensure status bar icons are visible on light backgrounds
    WindowCompat.getInsetsController(window, window.decorView)?.isAppearanceLightStatusBars = false
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled))
}