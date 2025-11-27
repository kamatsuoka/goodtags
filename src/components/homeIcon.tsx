import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { ComponentProps } from 'react'
import { StyleProp, TextStyle } from 'react-native'

const homeIcon = (
  name: ComponentProps<typeof Icon>['name'],
  size: number = 20,
) => {
  return (props?: { style?: StyleProp<TextStyle> }) => (
    <Icon name={name} size={size} style={props?.style} />
  )
}

export default homeIcon
