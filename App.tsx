import CommonStyles from "@app/constants/CommonStyles"
import RootStackNavigator from "@app/navigation/RootStackNavigator"
import {store, persistor} from "@app/store"
import {shouldRemindBackup, showBackupReminder} from "@app/modules/dataMigration"
import {LogBox, Platform, StatusBar} from "react-native"
import ErrorBoundary from "react-native-error-boundary"
import {GestureHandlerRootView} from "react-native-gesture-handler"
import {SafeAreaProvider} from "react-native-safe-area-context"
import {Provider as ReactReduxProvider} from "react-redux"
import {PersistGate} from "redux-persist/integration/react"
import {useEffect} from "react"

LogBox.ignoreLogs(["new NativeEventEmitter"]) // react-native-sound
LogBox.ignoreLogs(["InvariantState"]) // react-native-sound
LogBox.ignoreLogs(["shouldStartLoad"]) // react-native-webview for raster (non-pdf) sheet music

/**
 * Top-level component.
 */
const App = () => {
  useEffect(() => {
    // Check if user should be reminded about backup after app loads
    const checkBackupReminder = async () => {
      try {
        const shouldRemind = await shouldRemindBackup()
        if (shouldRemind) {
          // Wait a bit to ensure the app is fully loaded
          setTimeout(showBackupReminder, 3000)
        }
      } catch (error) {
        console.error("Error checking backup reminder:", error)
      }
    }
    
    checkBackupReminder()
  }, [])

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={CommonStyles.container}>
        <ErrorBoundary>
          <ReactReduxProvider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              {Platform.OS !== "android" && <StatusBar hidden={true} />}
              <RootStackNavigator />
            </PersistGate>
          </ReactReduxProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
export default App
