import CommonStyles from '@app/constants/CommonStyles'
import { useAppSelector } from '@app/hooks'
import RootStackNavigator from '@app/navigation/RootStackNavigator'
import { persistor, store } from '@app/store'
import { LogBox, StatusBar, StyleSheet, useColorScheme, View } from 'react-native'
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
  return (
    <View style={styles.appBackground}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </View>
  )
}

function StatusBarController() {
  const isDarkMode = useColorScheme() === 'dark'
  const showStatusBar = useAppSelector(state => state.options.showStatusBar)

  return (
    <StatusBar
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      hidden={!showStatusBar}
      translucent={true}
      backgroundColor="rgb(38, 94, 167)"
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
