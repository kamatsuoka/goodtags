import { StyleProp, StyleSheet, TextStyle } from 'react-native'
import { Text } from 'react-native-paper'

type TagIdProps = {
  id: number
  style: StyleProp<TextStyle>
}
export default function TagId(props: TagIdProps) {
  const { id, style } = props
  return (
    <Text style={style} numberOfLines={1} ellipsizeMode="clip">
      <Text style={styles.hash}>#</Text>
      {id}
    </Text>
  )
}

const styles = StyleSheet.create({
  hash: {
    fontSize: 14,
    letterSpacing: 3,
  },
})
