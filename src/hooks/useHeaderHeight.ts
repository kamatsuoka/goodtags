import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const HEADER_HEIGHT = 65
/**
 * Get os-dependent header height
 */
export default function useHeaderHeight() {
  const { top } = useSafeAreaInsets()
  const topFactor = Platform.OS === 'android' ? 0.6 : 0.5
  const baseHeight = HEADER_HEIGHT + Math.round(top * topFactor)
  return baseHeight
}
