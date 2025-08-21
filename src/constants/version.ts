import Constants from 'expo-constants'

/**
 * Centralized application version derived from Expo / native metadata.
 * Falls back gracefully if unavailable.
 */
export const APP_VERSION: string =
  (Constants?.expoConfig as any)?.version || // Managed / config driven
  (Constants as any).nativeAppVersion ||
  'unknown'

export default APP_VERSION
