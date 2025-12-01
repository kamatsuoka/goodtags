import Logo from '@app/components/Logo'
import { APP_VERSION } from '@app/constants/version'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'

/**
 * About view
 */
export default function AboutBase() {
  const theme = useTheme()
  const styles = StyleSheet.create({
    body: { alignItems: 'center', justifyContent: 'center' },
    text: { color: theme.colors.onPrimary },
  })

  const logoText = (text: string) => <Text style={styles.text}>{text}</Text>

  return (
    <View style={styles.body}>
      <Logo size={48} dark={false} />
      {logoText(APP_VERSION)}
      {logoText('by Kenji Matsuoka')}
    </View>
  )
}
