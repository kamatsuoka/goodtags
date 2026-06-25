/**
 * @format
 */

import { warmupDb } from '@app/modules/sqlUtil'
import { AppRegistry, LogBox } from 'react-native'
import App from './App'

// Suppress the LogBox banner in debug builds so it doesn't overlay UI during Maestro tests.
// The "Failed to initialize devtools client" warning fires when no Metro server is running
// (e.g. debug APK installed directly for screenshot automation).
if (__DEV__) {
  LogBox.ignoreAllLogs()
}

AppRegistry.registerComponent('main', () => App)

// Kickoff setting up the DB, including potentially downloading an updated DB, at app startup.
warmupDb()
