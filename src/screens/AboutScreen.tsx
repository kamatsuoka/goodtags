import AboutWithCredits from '@app/components/AboutWithCredits'
import { RootStackParamList } from '@app/navigation/navigationParams'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, View } from 'react-native'
import { IconButton, useTheme } from 'react-native-paper'

type Props = NativeStackScreenProps<RootStackParamList, 'About'>
/**
 * About goodtags
 */
export default function AboutScreen({ navigation }: Props) {
  const theme = useTheme()
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    iconHolder: {
      justifyContent: 'flex-start',
    },
  })

  return (
    <View style={styles.container} testID="about_screen">
      <AboutWithCredits />
      <View style={styles.iconHolder}>
        <IconButton
          onPress={navigation.goBack}
          icon="arrow-left"
          iconColor={theme.colors.onPrimary}
        />
      </View>
    </View>
  )
}
