import useShallowScreen from "@app/hooks/useShallowScreen"
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs"
import {Platform, StyleSheet} from "react-native"
import {useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import {TabBarBackground} from "../lib/theme"
import {FavoritesScreen} from "../screens/FavoritesScreen"
import HistoryScreen from "../screens/HistoryScreen"
import SearchScreen from "../screens/SearchScreen"
import HomeNavigator from "./HomeNavigator"
import {TabsParamList} from "./navigationParams"

export const FAVORITES_TAB_INDEX = 2 // should match order of tabs below

/**
 * Tab view of tag lists
 */
export default function TabNavigator() {
  const Tab = createBottomTabNavigator<TabsParamList>()
  const theme = useTheme()
  const shallowScreen = useShallowScreen()
  const insets = useSafeAreaInsets()

  const ios = Platform.OS === "ios"

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: TabBarBackground,
    },
    tabBar: {
      backgroundColor: TabBarBackground,
      height: (ios ? 90 : 75 + insets.bottom) - (shallowScreen ? 30 : 0),
      paddingTop: 5,
      paddingBottom: ios ? 25 : 15 + insets.bottom,
      paddingLeft: ios ? 0 : insets.left,
      paddingRight: ios ? 0 : insets.right,
    },
    tabBarLabel: {
      fontFamily: theme.fonts.labelSmall.fontFamily,
      fontSize: 14,
    },
  })

  // note: setting freezeOnBlur: true improves performance, but
  // at one point seemed to lead to wrong layouts
  // returning to favorites list from tag screen ...
  const screenOptions: BottomTabNavigationOptions = {
    freezeOnBlur: true,
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarInactiveTintColor: theme.colors.outline,
    tabBarLabelStyle: styles.tabBarLabel,
    tabBarStyle: styles.tabBar,
    tabBarLabelPosition: shallowScreen ? "beside-icon" : "below-icon",
  }

  return (
    <Tab.Navigator
      initialRouteName="HomeNavigator"
      screenOptions={screenOptions}
      sceneContainerStyle={{
        // Paddings to handle safe area
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <Tab.Screen
        name="HomeNavigator"
        component={HomeNavigator}
        options={{
          title: "home",
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: "search",
          tabBarIcon: SearchIcon,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "faves",
          tabBarIcon: FavoritesIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "history",
          tabBarIcon: HistoryIcon,
        }}
      />
    </Tab.Navigator>
  )
}

function tabIcon(name: string) {
  return (props: {focused: boolean; color: string; size: number}) => (
    <Icon name={name} size={props.size} color={props.color} />
  )
}

const HomeIcon = tabIcon("home")
const SearchIcon = tabIcon("magnify")
const FavoritesIcon = tabIcon("heart-outline")
const HistoryIcon = tabIcon("history")
