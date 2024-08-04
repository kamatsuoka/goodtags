import {StyleSheet} from "react-native"
import useHeaderHeight from "./useHeaderHeight"

/**
 * Get os-dependent fab group style
 */
export default function useFabDownStyle() {
  const headerHeight = useHeaderHeight()
  return StyleSheet.create({
    fabGroup: {
      paddingTop: headerHeight - 45,
    },
  })
}
