import { LogoFont } from '@app/lib/theme'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from 'react-native-paper'

type Props = {
  size: number
  dark: boolean
}

/**
 * The googtags logo in fancy font
 */
const Logo = (props: Props) => {
  const theme = useTheme()
  const styles = StyleSheet.create({
    logo: {
      fontSize: props.size,
      fontFamily: LogoFont,
      color: props.dark ? theme.colors.primary : theme.colors.onPrimary,
    },
  })
  return (
    <View>
      <Text key="logo.2" style={styles.logo}>
        goodtags
      </Text>
    </View>
  )
}

export default Logo
