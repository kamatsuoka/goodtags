import { useEffect, useState } from 'react'
import { ColorValue, Platform, StyleSheet, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { Text, useTheme } from 'react-native-paper'

type ComponentProps = {
  note: string
  size: number
  color: ColorValue
}

type Props = ComponentProps

const SharpSign = '♯'
const FlatSign = '♭'

function noteLabel(note: string): string {
  switch (note.length) {
    case 1:
      return note
    case 2:
      return note[0] + note[1].replace('b', FlatSign).replace('#', SharpSign)
    default:
      return '?'
  }
}

/**
 * A musical note button that plays the note when pressed.
 */
const NoteButton = (props: Props) => {
  const theme = useTheme()
  const [isEmulator, setIsEmulator] = useState(false)

  useEffect(() => {
    DeviceInfo.isEmulator().then(setIsEmulator)
  }, [])

  const FONT_MULTIPLIER = 0.8
  const ACCIDENTAL_FONT_MULTIPLIER = Platform.OS === 'android' ? 1 : 0.6
  const fontSize = props.size * FONT_MULTIPLIER
  const accidentalSize = fontSize * ACCIDENTAL_FONT_MULTIPLIER

  // Different positioning for simulator vs real device
  const getTop = () => {
    if (Platform.OS === 'android') return -4
    return isEmulator ? -1 : -5
  }

  const top = getTop()
  const accidentalTop = Platform.OS === 'android' ? -4 : -4

  const styles = StyleSheet.create({
    label: {
      fontSize,
      color: theme.colors.primary,
      top,
      letterSpacing: Platform.OS === 'android' ? 5 : -4,
    },
    accidental: {
      fontSize: accidentalSize,
      color: theme.colors.primary,
      position: 'relative',
      top: accidentalTop,
      paddingRight: Platform.OS === 'ios' && !isEmulator ? 2 : 0,
    },
    labelHolder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
  })
  if (props.note) {
    const label = noteLabel(props.note)
    const getLeftOffset = () => {
      if (Platform.OS !== 'ios' || label.length === 1) return 0
      return isEmulator ? 3 : -1
    }
    const labelHolderStyle = StyleSheet.compose(styles.labelHolder, {
      left: getLeftOffset(),
    })
    return Platform.OS === 'ios' ? (
      <View style={labelHolderStyle}>
        <Text style={styles.label}>
          {label[0]}
          <Text style={styles.accidental}>
            {label.length > 1 ? label[1] : ''}
          </Text>
        </Text>
      </View>
    ) : (
      <View style={labelHolderStyle}>
        <Text style={styles.label}>{label[0]}</Text>
        <Text style={styles.accidental}>
          {label.length > 1 ? label[1] : ''}
        </Text>
      </View>
    )
  }
  return null
}

export default NoteButton
