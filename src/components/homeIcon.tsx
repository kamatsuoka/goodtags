import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { ComponentProps } from 'react'

const homeIcon = (
  name: ComponentProps<typeof Icon>['name'],
  size: number = 20,
) => {
  return () => <Icon name={name} size={size} />
}

export default homeIcon
