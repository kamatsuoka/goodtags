import { FontAwesome6, MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { ColorValue, StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

type ComponentProps = {
  note: string
  size: number
  color: ColorValue
}

type Props = ComponentProps

const getAccidentalIcon = (accidental: string): string | null => {
  if (accidental === '#') return 'music-accidental-sharp'
  if (accidental === 'b') return 'music-accidental-flat'
  return null
}

function noteLabel(note: string): string {
  return note.length > 0 ? note[0].toLowerCase() : '?'
}

function getAccidental(note: string): string | null {
  return note.length > 1 ? note[1] : null
}

/**
 * A musical note button that plays the note when pressed.
 */
const NoteButton = (props: Props) => {
  const theme = useTheme()
  const fontSize = props.size * 0.7

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: props.size,
      height: props.size,
    },
    noteText: {
      fontSize,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    accidental: {
      position: 'absolute',
      left: fontSize * 0.85,
    },
  })

  if (props.note) {
    const label = noteLabel(props.note)
    const accidental = getAccidental(props.note)
    const accidentalIconName = accidental ? getAccidentalIcon(accidental) : null

    return (
      <View style={styles.container}>
        <FontAwesome6 name={label as any} size={fontSize} color={theme.colors.primary} />
        {accidentalIconName && (
          <Icon
            name={accidentalIconName as any}
            size={fontSize}
            color={theme.colors.primary}
            style={styles.accidental}
          />
        )}
      </View>
    )
  }
  return null
}

export default NoteButton
