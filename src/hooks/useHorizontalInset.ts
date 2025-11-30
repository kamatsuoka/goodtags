import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useHorizontalInset = () => {
  const insets = useSafeAreaInsets()
  const paddingHorizontal = Math.max(insets.left, insets.right)
  return paddingHorizontal
}
