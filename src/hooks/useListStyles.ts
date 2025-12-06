import { StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'

/**
 * Use shared styles for lists other than tag lists
 */
export const useListStyles = () => {
  const theme = useTheme()

  const listStyles = StyleSheet.create({
    listHolder: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      height: 56,
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
  })

  const pressableStyle = ({ pressed }: { pressed: boolean }) => ({
    backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
  })

  return { listStyles, pressableStyle }
}
