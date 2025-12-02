import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowShape } from './useWindowShape'

export const HEADER_HEIGHT = 58
/**
 * Get os-dependent header height
 */
export function useHeaderHeight() {
  const { landscape } = useWindowShape()

  const top = Math.max(landscape ? 0 : 30, useSafeAreaInsets().top)
  const topFactor = Platform.OS === 'android' ? 0.6 : 0.5
  return HEADER_HEIGHT + Math.round(top * topFactor)
}
