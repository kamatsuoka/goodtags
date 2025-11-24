import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'

const homeIcon = (name: string, size: number = 20) => {
  return () => <Icon name={name} size={size} />
}

export default homeIcon
