import {useAppSelector} from "@app/hooks"
import {TagState} from "@app/modules/visitSlice"
import {RootStackParamList} from "@app/navigation/navigationParams"
import {NativeStackScreenProps} from "@react-navigation/native-stack"
import {useEffect} from "react"
import {StyleSheet, View} from "react-native"
import {useTheme} from "react-native-paper"

type Props = NativeStackScreenProps<RootStackParamList, "LandscapeTransition">

/**
 * Transition screen between tag lists and tag screen to avoid glitches
 * in automatic orientation change. See [transitions.md](../../docs/transitions.md)
 */
const LandscapeTransition = ({navigation}: Props) => {
  const theme = useTheme()
  const tagState = useAppSelector(state => state.visit.tagState)
  const autoRotateDelay = useAppSelector(state => state.options.autoRotateDelay)

  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  })

  useEffect(() => {
    console.log({autoRotateDelay})
    setTimeout(() => {
      if (tagState === TagState.opening) {
        navigation.navigate("Tag")
      } else {
        navigation.goBack()
      }
    }, autoRotateDelay)
  }, [autoRotateDelay, navigation, tagState])

  return <View style={styles.container} />
}

export default LandscapeTransition
