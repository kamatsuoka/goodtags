import useHeaderHeight from "./useHeaderHeight"
import {StyleSheet} from "react-native"

/**
 * Get os-dependent fab group style
 */
export default function useFabDownStyle() {
  const headerHeight = useHeaderHeight()
  return StyleSheet.create({
    fabGroup: {
      paddingTop: headerHeight - 50,
    },
  })
}
