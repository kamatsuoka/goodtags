import useShallowScreen from '@app/hooks/useShallowScreen'
import HistoryScreen from '@app/screens/HistoryScreen'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { Platform, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabBarBackground } from '../lib/theme'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import SearchScreen from '../screens/SearchScreen'
import HomeNavigator from './HomeNavigator'
import { TabsParamList } from './navigationParams'

export const FAVORITES_TAB_INDEX = 2 // should match order of tabs below

/**
 * Tab view of tag lists
 */
export default function TabNavigator() {
  const Tab = createBottomTabNavigator<TabsParamList>()
  const theme = useTheme()
  const shallowScreen = useShallowScreen()
  const insets = useSafeAreaInsets()

  const ios = Platform.OS === 'ios'

  const androidHorizPadding = Math.max(insets.left, insets.right)

  const containerStyle = {
    flex: 1,
    backgroundColor: TabBarBackground,
    paddingHorizontal: ios ? 0 : androidHorizPadding,
  }
  const minHeight = ios ? 50 : 60
  // beside-icon vs below-icon
  const height = Math.max(minHeight, insets.bottom + (shallowScreen ? 35 : 55))
  const tabBarStyle = {
    backgroundColor: TabBarBackground,
    height: height,
    paddingTop: 5,
    shadowColor: 'white',
  }

  const tabBarLabelStyle = {
    fontFamily: theme.fonts.labelSmall.fontFamily,
    fontSize: 14,
  }

  // note: setting freezeOnBlur: true improves performance, but
  // at one point seemed to lead to wrong layouts
  // returning to favorites list from tag screen ...
  const screenOptions: BottomTabNavigationOptions = {
    freezeOnBlur: true,
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarInactiveTintColor: theme.colors.outline,
    tabBarLabelStyle,
    tabBarStyle,
    tabBarLabelPosition: shallowScreen ? 'beside-icon' : 'below-icon',
  }

  return (
    <View style={containerStyle}>
      <Tab.Navigator
        initialRouteName="HomeNavigator"
        screenOptions={screenOptions}
      >
        <Tab.Screen
          name="HomeNavigator"
          component={HomeNavigator}
          options={{
            title: 'home',
            tabBarIcon: HomeIcon,
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            title: 'search',
            tabBarIcon: SearchIcon,
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            title: 'faves',
            tabBarIcon: FavoritesIcon,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'history',
            tabBarIcon: HistoryIcon,
          }}
        />
      </Tab.Navigator>
    </View>
  )
}

function tabIcon(name: string) {
  return (props: { focused: boolean; color: string; size: number }) => (
    <Icon name={name as any} size={props.size} color={props.color} />
  )
}

const HomeIcon = tabIcon('home')
const SearchIcon = tabIcon('magnify')
const FavoritesIcon = tabIcon('heart-outline')
const HistoryIcon = tabIcon('history')
