import {Text} from "react-native-paper"
import React from "react"
import {StyleProp, TextStyle} from "react-native"

type TagIdProps = {
  id: number
  style: StyleProp<TextStyle>
}
export default function TagId(props: TagIdProps) {
  const {id, style} = props
  return (
    <Text style={style} numberOfLines={1} ellipsizeMode="clip">
      # {id}
    </Text>
  )
}
