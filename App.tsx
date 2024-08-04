import CommonStyles from "@app/constants/CommonStyles"
import RootStackNavigator from "@app/navigation/RootStackNavigator"
import {persistor, store} from "@app/store"
import {LogBox, Platform, StatusBar} from "react-native"
import ErrorBoundary from "react-native-error-boundary"
import {GestureHandlerRootView} from "react-native-gesture-handler"
import {SafeAreaProvider} from "react-native-safe-area-context"
import {Provider as ReactReduxProvider} from "react-redux"
import {PersistGate} from "redux-persist/integration/react"

LogBox.ignoreLogs(["new NativeEventEmitter"]) // react-native-sound
LogBox.ignoreLogs(["InvariantState"]) // react-native-sound
LogBox.ignoreLogs(["shouldStartLoad"]) // react-native-webview for raster (non-pdf) sheet music

/**
 * Top-level component.
 */
const App = () => {
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
