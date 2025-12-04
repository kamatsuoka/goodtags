import CommonStyles from '@app/constants/CommonStyles'
import { useAppSelector } from '@app/hooks'
import StatusBarModule from '@app/modules/StatusBarModule'
import RootStackNavigator from '@app/navigation/RootStackNavigator'
import { persistor, store } from '@app/store'
import { setAudioModeAsync } from 'expo-audio'
import { useEffect } from 'react'
import { LogBox, Platform, StatusBar, StyleSheet, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as ReactReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

LogBox.ignoreLogs(['shouldStartLoad']) // react-native-webview for raster (non-pdf) sheet music

// Configure audio mode once for the entire app
setAudioModeAsync({ playsInSilentMode: true })

/**
 * Top-level component.
 */
function App() {
  return (
    <View style={styles.appBackground}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </View>
  )
}

function StatusBarController() {
  const showStatusBar = useAppSelector(state => state.options.showStatusBar)

  // Control status bar visibility using custom native module on Android
  // to avoid breaking edge-to-edge mode
  useEffect(() => {
    if (Platform.OS === 'android' && StatusBarModule) {
      StatusBarModule.setHidden(!showStatusBar)
    } else {
      // iOS: use standard API
      StatusBar.setHidden(!showStatusBar, 'none')
    }
    StatusBar.setTranslucent(true)
    StatusBar.setBackgroundColor('transparent')
    StatusBar.setBarStyle('light-content')
  }, [showStatusBar])

  // Don't render the StatusBar component on Android as it can interfere with edge-to-edge
  // Use imperative API instead (above)
  if (Platform.OS === 'android') {
    return null
  }

  return (
    <StatusBar
      hidden={!showStatusBar}
      translucent={true}
      backgroundColor="transparent"
      barStyle="light-content"
    />
  )
}

function AppContent() {
  return (
    <GestureHandlerRootView style={[styles.container, CommonStyles.container]}>
      <ErrorBoundary>
        <ReactReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <StatusBarController />
            <RootStackNavigator />
          </PersistGate>
        </ReactReduxProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: 'rgb(38, 94, 167)', // theme.colors.primary
  },
  container: {
    flex: 1,
  },
})

export default App
