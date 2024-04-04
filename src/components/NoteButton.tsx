import {ColorValue, Platform, StyleSheet, View} from "react-native"
import {Text, useTheme} from "react-native-paper"

type ComponentProps = {
  note: string
  size: number
  color: ColorValue
}

type Props = ComponentProps

const SharpSign = "♯"
const FlatSign = "♭"

function noteLabel(note: string): string {
  switch (note.length) {
    case 1:
      return note
    case 2:
      return note[0] + note[1].replace("b", FlatSign).replace("#", SharpSign)
    default:
      return "?"
  }
}

/**
 * A musical note button that plays the note when pressed.
 */
const NoteButton = (props: Props) => {
  const theme = useTheme()
  const FONT_MULTIPLIER = 0.8
  const ACCIDENTAL_FONT_MULTIPLIER = Platform.OS === "android" ? 0.8 : 0.7
  const fontSize = props.size * FONT_MULTIPLIER
  const accidentalSize = fontSize * ACCIDENTAL_FONT_MULTIPLIER
  const top = Platform.OS === "android" ? -4 : -1
  const accidentalTop = Platform.OS === "android" ? -4 : 0

  const styles = StyleSheet.create({
    label: {
      fontSize,
      color: theme.colors.primary,
      top,
      letterSpacing: Platform.OS === "android" ? 5 : -2,
    },
    accidental: {
      fontSize: accidentalSize,
      color: theme.colors.primary,
      position: "relative",
      top: accidentalTop,
    },
    labelHolder: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
  })
  if (props.note) {
    const label = noteLabel(props.note)
    const labelHolderStyle =
      Platform.OS === "ios" && label.length > 1
        ? StyleSheet.compose(styles.labelHolder, {left: 3})
        : styles.labelHolder
    return Platform.OS === "ios" ? (
      <View style={labelHolderStyle}>
        <Text style={styles.label}>
          {label[0]}
          <Text style={styles.accidental}>
            {label.length > 1 ? label[1] : ""}
          </Text>
        </Text>
      </View>
    ) : (
      <View style={labelHolderStyle}>
        <Text style={styles.label}>{label[0]}</Text>
        <Text style={styles.accidental}>
          {label.length > 1 ? label[1] : ""}
        </Text>
      </View>
    )
  }
  return null
}

export default NoteButton
