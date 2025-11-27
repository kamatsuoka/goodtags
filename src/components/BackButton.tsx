import { useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native'
import { IconButton, useTheme } from 'react-native-paper'

export const ICON_SIZE = 34
export const BUTTON_SIZE = ICON_SIZE + 10

export default function BackButton() {
  const theme = useTheme()
  const navigation = useNavigation()

  const themedStyles = StyleSheet.create({
    button: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: 'transparent',
    },
  })

  return (
    <IconButton
      icon="chevron-left"
      iconColor={theme.colors.onPrimary}
      size={ICON_SIZE}
      style={themedStyles.button}
      mode="contained"
      onPress={() => navigation.goBack()}
      testID="logo_button"
    />
  )
}
