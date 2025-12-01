import { useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native'
import { IconButton, useTheme } from 'react-native-paper'

export const ICON_SIZE = 42
export const BUTTON_SIZE = ICON_SIZE + 6

type BackButtonProps = {
  iconColor?: string
  onBack?: () => void
  icon?: string
}

export default function BackButton({
  iconColor,
  onBack,
  icon = 'chevron-left',
}: BackButtonProps = {}) {
  const theme = useTheme()
  const navigation = useNavigation()

  const themedStyles = StyleSheet.create({
    button: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: 'transparent',
      marginTop: 2,
    },
  })

  return (
    <IconButton
      icon={icon}
      iconColor={iconColor ?? theme.colors.onPrimary}
      size={icon === 'close' ? ICON_SIZE - 10 : ICON_SIZE}
      style={themedStyles.button}
      mode="contained"
      onPress={() => (onBack ? onBack() : navigation.goBack())}
      testID="logo_button"
    />
  )
}
