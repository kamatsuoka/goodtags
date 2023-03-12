import {useAppSelector} from "@app/hooks"
import * as Haptics from "expo-haptics"
import {ImpactFeedbackStyle, NotificationFeedbackType} from "expo-haptics"

const MockHaptics = {
  selectionAsync: () => Promise.resolve(),
  impactAsync: (_: ImpactFeedbackStyle) => Promise.resolve(),
  notificationAsync: (_: NotificationFeedbackType) => Promise.resolve(),
}

/**
 * Get os-dependent header height
 */
export default function useHaptics() {
  const doHaptics = useAppSelector(state => state.options.haptics)
  return doHaptics ? Haptics : MockHaptics
}
