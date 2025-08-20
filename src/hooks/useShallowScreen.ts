import { useEffect, useState } from 'react'
import { Dimensions, ScaledSize } from 'react-native'

const SHALLOW_HEIGHT = 500
const isShallowScreen = ({ width, height }: ScaledSize) =>
  width > height && height <= SHALLOW_HEIGHT

/**
 * Are we on shallow screen (landscape mode, low height)?
 *
 * adapted from https://github.com/react-native-community/hooks/blob/master/src/useDeviceOrientation.ts
 */
export default function useShallowScreen() {
  const screen = Dimensions.get('screen')
  const initialState = isShallowScreen(screen)
  const [shallowScreen, setShallowScreen] = useState(initialState)

  useEffect(() => {
    const onChange = (event: { screen: ScaledSize }) => {
      setShallowScreen(isShallowScreen(event.screen))
    }
    const subscription = Dimensions.addEventListener('change', onChange)
    return () => subscription.remove()
  }, [])

  return shallowScreen
}
