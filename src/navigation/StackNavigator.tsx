import CreateLabel from "@app/components/CreateLabel"
import LabelEditor from "@app/components/LabelEditor"
import TagLabels from "@app/components/TagLabels"
import {MainTheme, SansSerifTheme} from "@app/lib/theme"
import AboutScreen from "@app/screens/AboutScreen"
import LandscapeTransition from "@app/screens/LandscapeTransition"
import OptionsScreen from "@app/screens/OptionsScreen"
import PortraitTransition from "@app/screens/PortraitTransition"
import {
  DrawerActions,
  NavigationContainer,
  useNavigation,
} from "@react-navigation/native"
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack"
import {HeaderBackButtonProps} from "@react-navigation/native-stack/lib/typescript/src/types"
import {useMemo} from "react"
import {Platform} from "react-native"
import {Provider as PaperProvider, Text} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import {useAppSelector} from "../hooks"
import TagScreen from "../screens/TagScreen"
import WelcomeScreen from "../screens/WelcomeScreen"
import DrawerNavigator from "./DrawerNavigator"
import {StackParamList} from "./navigationParams"

function HeaderCancel() {
  const navigation = useNavigation()
  return <Text onPress={navigation.goBack}>cancel</Text>
}

const BACK_ICON = "chevron-left"
const BACK_ICON_SIZE = 36

const BackButton = (_props: HeaderBackButtonProps) => {
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

const BackToDrawerClose = (_props: HeaderBackButtonProps) => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const style = {paddingLeft: Platform.OS === "android" ? insets.left : 0}

  return (
    <Icon
      name={BACK_ICON}
      size={BACK_ICON_SIZE}
      style={style}
      onPress={() => {
        navigation.dispatch(DrawerActions.closeDrawer())
        navigation.goBack()
      }}
    />
  )
}

/**
 * Navigator stack.
 */
export default function StackNavigator() {
  const Stack = createNativeStackNavigator<StackParamList>()
  const lastVisited = useAppSelector(state => state.visit.lastVisited)
  const autoRotate = useAppSelector(state => state.options.autoRotate)
  const serifs = useAppSelector(state => state.options.serifs)
  const insets = useSafeAreaInsets()

  const drawerOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? "portrait_up" : "all",
    }),
    [autoRotate],
  )

  const tagOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? "landscape_right" : "all",
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

  const theme = serifs ? MainTheme : SansSerifTheme
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName={lastVisited ? "Drawer" : "Welcome"}
          screenOptions={screenOptions}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Drawer"
            component={DrawerNavigator}
            options={drawerOrientation}
          />
          <Stack.Screen
            name="Tag"
            component={TagScreen}
            options={tagOrientation}
          />
          <Stack.Screen
            name="PortraitTransition"
            component={PortraitTransition}
            options={{animation: "none", ...drawerOrientation}}
          />
          <Stack.Screen
            name="LandscapeTransition"
            component={LandscapeTransition}
            options={{animation: "none", ...tagOrientation}}
          />
          <Stack.Group
            screenOptions={{
              headerShown: true,
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
              name="About"
              component={AboutScreen}
              options={{
                headerShown: false,
                contentStyle: {
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                ...drawerOrientation,
              }}
            />
            <Stack.Screen
              name="Options"
              component={OptionsScreen}
              options={{
                title: "options",
                headerLeft: BackToDrawerClose,
                ...drawerOrientation,
              }}
            />
            <Stack.Screen
              name="LabelEditor"
              component={LabelEditor}
              options={{
                title: "edit labels",
                headerLeft: BackButton,
                ...drawerOrientation,
              }}
            />
            <Stack.Screen
              name="CreateLabel"
              component={CreateLabel}
              options={{
                title: "new label",
                headerLeft: HeaderCancel,
                headerBackVisible: false,
                headerTitleAlign: "center",
                orientation: "all",
              }}
            />
            <Stack.Screen
              name="TagLabels"
              component={TagLabels}
              options={{
                title: "labels",
                headerLeft: BackButton,
                ...tagOrientation,
              }}
            />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  )
}
