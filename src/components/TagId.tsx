import { Text } from '@app/components/Text'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'

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
