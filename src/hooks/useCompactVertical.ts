import { isTablet } from 'react-native-device-info'
import useShallowScreen from './useShallowScreen'

/**
 * Are we on shallow screen (landscape mode, not a tablet)?
 */
export default function useCompactVertical() {
  const tablet = isTablet()
  const landscape = useShallowScreen()

  return landscape && !tablet
}
