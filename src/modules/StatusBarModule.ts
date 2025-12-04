import { NativeModules, Platform } from 'react-native'

interface StatusBarModuleInterface {
  setHidden: (hidden: boolean) => void
}

const StatusBarModule: StatusBarModuleInterface | null =
  Platform.OS === 'android' ? NativeModules.StatusBarModule : null

export default StatusBarModule
