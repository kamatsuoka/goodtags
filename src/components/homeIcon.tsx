import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const homeIcon = (name: string, size: number = 20) => {
  return () => <Icon name={name} size={size} />
}

export default homeIcon
