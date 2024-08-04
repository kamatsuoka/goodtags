import AboutBase from "@app/components/AboutBase"
import {useAppDispatch} from "@app/hooks"
import useHaptics from "@app/hooks/useHaptics"
import {getPopularTags} from "@app/modules/popularSlice"
import {setLastVisited} from "@app/modules/visitSlice"
import {RootStackParamList} from "@app/navigation/navigationParams"
import {NativeStackScreenProps} from "@react-navigation/native-stack"
import {useEffect} from "react"
import {StyleSheet, View} from "react-native"
import {IconButton, Text, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">
/**
 * Welcome screen
 */
export default function WelcomeScreen(props: Props) {
  const haptics = useHaptics()
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const navigation = props.navigation
  const insets = useSafeAreaInsets()
  const styles = StyleSheet.create({
    welcomeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    iconHolder: {
      justifyContent: "flex-start",
      marginTop: 10,
    },
  })

  // preload popular tags
  useEffect(() => {
    dispatch(getPopularTags(true))
  }, [dispatch])

  return (
    <View style={styles.welcomeContainer}>
      <Text>Welcome to</Text>
      <AboutBase />
      <View style={styles.iconHolder}>
        <IconButton
          onPress={async () => {
            await haptics.selectionAsync()
            dispatch(setLastVisited())
            navigation.navigate("Tabs")
          }}
          icon="arrow-right"
          iconColor={theme.colors.onPrimary}
          testID="welcome_forward_button"
        />
      </View>
    </View>
  )
}
