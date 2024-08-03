import HomeScreen from "@app/screens/HomeScreen"
import {LabeledScreen} from "@app/screens/LabeledScreen"
import OptionsScreen from "@app/screens/OptionsScreen"
import PopularScreen from "@app/screens/PopularScreen"
import {useNavigation} from "@react-navigation/native"
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack"
import {HeaderBackButtonProps} from "@react-navigation/native-stack/lib/typescript/src/types"
import {useMemo} from "react"
import {Platform} from "react-native"
import {useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import {useAppSelector} from "../hooks"
import {HomeParamList} from "./navigationParams"

const BACK_ICON = "chevron-left"
const BACK_ICON_SIZE = 36

export const BackButton = (_props: HeaderBackButtonProps) => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const style = {paddingLeft: Platform.OS === "android" ? insets.left : 0}

  return (
    <Icon
      name={BACK_ICON}
      size={BACK_ICON_SIZE}
      style={style}
      onPress={navigation.goBack}
    />
  )
}

/**
 * navigator for home screen, which links to collections, labeled lists, etc
 */
export default function HomeNavigator() {
  const Stack = createNativeStackNavigator<HomeParamList>()
  const autoRotate = useAppSelector(state => state.options.autoRotate)
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const homeOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? "portrait_up" : "all",
    }),
    [autoRotate],
  )

  /**
   * Notes: setting animation: none combined with freezeOnBlur
   * on tab navigator leads to wrong renders on the lists.
   */
  const screenOptions: NativeStackNavigationOptions = {
    freezeOnBlur: true,
    headerShown: false,
    animation: "fade",
  }

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Popular"
        component={PopularScreen}
        options={{headerLeft: BackButton, ...homeOrientation}}
      />
      <Stack.Screen
        name="Labeled"
        component={LabeledScreen}
        options={{headerLeft: BackButton, ...homeOrientation}}
      />
      <Stack.Group
        screenOptions={{
          headerShown: true,
          headerLeft: BackButton,
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: theme.colors.inversePrimary,
          },
          headerTitleStyle: {
            fontFamily: theme.fonts.titleSmall.fontFamily,
          },
          contentStyle: {
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          headerTitleAlign: "center",
        }}>
        <Stack.Screen
          name="Options"
          component={OptionsScreen}
          options={{
            title: "options",
            ...homeOrientation,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  )
}
