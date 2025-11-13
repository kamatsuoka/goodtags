import CommonStyles from '@app/constants/CommonStyles'
import RootStackNavigator from '@app/navigation/RootStackNavigator'
import { persistor, store } from '@app/store'
import {
  LogBox,
  Platform,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as ReactReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

LogBox.ignoreLogs(['shouldStartLoad']) // react-native-webview for raster (non-pdf) sheet music

/**
 * Top-level component.
 */
function App() {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        hidden={Platform.OS !== 'android'}
      />
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  return (
    <GestureHandlerRootView style={[styles.container, CommonStyles.container]}>
      <ErrorBoundary>
        <ReactReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <RootStackNavigator />
          </PersistGate>
        </ReactReduxProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default App
