import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useBodyInsets = () => {
  const insets = useSafeAreaInsets()
  const paddingLeft = insets.left
  const paddingRight = insets.right
  return { paddingLeft, paddingRight }
}
