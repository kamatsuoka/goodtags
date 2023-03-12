import {useSafeAreaInsets} from "react-native-safe-area-context"

export const HEADER_HEIGHT = 65
/**
 * Get os-dependent header height
 */
export default function useHeaderHeight() {
  const {top} = useSafeAreaInsets()
  return top ? HEADER_HEIGHT + top / 4 : HEADER_HEIGHT
}
