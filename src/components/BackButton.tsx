import { HEADER_BUTTON_SIZE } from '@app/constants/CommonStyles'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native'
import { IconButton, useTheme } from 'react-native-paper'

export const ICON_SIZE = 42

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

  return (
    <IconButton
      icon={icon}
      iconColor={iconColor ?? theme.colors.onPrimary}
      size={icon === 'close' ? ICON_SIZE - 10 : ICON_SIZE}
      style={styles.button}
      mode="contained"
      onPress={() => (onBack ? onBack() : navigation.goBack())}
      testID="logo_button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
})
