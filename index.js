/**
 * @format
 */

import { warmupDb } from '@app/modules/sqlUtil'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)

// Kickoff setting up the DB, including potentially downloading an updated DB, at app startup.
warmupDb()
