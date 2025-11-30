import { useWindowDimensions } from 'react-native'

export const SHALLOW_HEIGHT = 500

export const isShallowScreen = (width: number, height: number) =>
  width > height && height <= SHALLOW_HEIGHT

export function useWindowShape() {
  const { width, height } = useWindowDimensions()
  const landscape = width > height
  const shallowScreen = isShallowScreen(width, height)
  return { landscape, shallowScreen }
}
