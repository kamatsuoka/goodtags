import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { ComponentProps } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

const homeIcon = (
  name: ComponentProps<typeof Icon>['name'],
  size: number = 20,
) => {
  return (props?: { style?: StyleProp<ViewStyle> }) => (
    <Icon name={name} size={size} style={props?.style} />
  )
}

export default homeIcon
