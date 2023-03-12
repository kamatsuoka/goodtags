/**
 * @format
 */

import "react-native-gesture-handler"
import {AppRegistry} from "react-native"
import App from "./App"
import {name as appName} from "./app.json"
import {
  getUnhandledPromiseRejectionTracker,
  setUnhandledPromiseRejectionTracker,
} from "react-native-promise-rejection-utils"

const prevTracker = getUnhandledPromiseRejectionTracker()

if (__DEV__) {
  const ignoreWarns = [
    "VirtualizedLists should never be nested inside plain ScrollViews",
  ]

  const errorWarn = global.console.error
  global.console.error = (...arg) => {
    for (const error of ignoreWarns) {
      if (arg[0].startsWith(error)) {
        return
      }
    }
    errorWarn(...arg)
  }
}

setUnhandledPromiseRejectionTracker((id, error) => {
  console.warn("Unhandled promise rejection!", id, error)

  if (prevTracker !== undefined) {
    prevTracker(id, error)
  }
})
AppRegistry.registerComponent(appName, () => App)
