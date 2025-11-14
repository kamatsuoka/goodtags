import { navHeader } from '@app/components/CommonHeader'
import CreateLabel from '@app/components/CreateLabel'
import TagLabels from '@app/components/TagLabels'
import { MainTheme, SansSerifTheme } from '@app/lib/theme'
import AboutScreen from '@app/screens/AboutScreen'
import { FavoritesScreen } from '@app/screens/FavoritesScreen'
import HistoryScreen from '@app/screens/HistoryScreen'
import LandscapeTransition from '@app/screens/LandscapeTransition'
import PortraitTransition from '@app/screens/PortraitTransition'
import { NavigationContainer } from '@react-navigation/native'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { Provider as PaperProvider } from 'react-native-paper'
import { useAppSelector, useBodyInsets, useHorizontalInset } from '../hooks'
import TagScreen from '../screens/TagScreen'
import RandomScreen from '@app/screens/RandomScreen'
import WelcomeScreen from '../screens/WelcomeScreen'
import TabNavigator from './TabNavigator'
import { RootStackParamList } from './navigationParams'

/**
 * Navigator stack.
 */
export default function RootStackNavigator() {
  const Stack = createNativeStackNavigator<RootStackParamList>()
  const lastVisited = useAppSelector(state => state.visit.lastVisited)
  const autoRotate = useAppSelector(state => state.options.autoRotate)
  const serifs = useAppSelector(state => state.options.serifs)
  const { paddingLeft, paddingRight } = useBodyInsets()
  const ios = Platform.OS === 'ios'
  const paddingHorizontal = useHorizontalInset()

  const homeOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? 'portrait_up' : 'all',
    }),
    [autoRotate],
  )

  const tagOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? 'landscape_right' : 'all',
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
    animation: 'fade',
  }

  const theme = serifs ? MainTheme : SansSerifTheme

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName={lastVisited ? 'Tabs' : 'Welcome'}
          screenOptions={screenOptions}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Tabs"
            component={TabNavigator}
            options={homeOrientation}
          />
          <Stack.Screen
            name="Tag"
            component={TagScreen}
            options={tagOrientation}
          />
          <Stack.Screen
            name="PortraitTransition"
            component={PortraitTransition}
            options={{ animation: 'none', ...homeOrientation }}
          />
          <Stack.Screen
            name="LandscapeTransition"
            component={LandscapeTransition}
            options={{ animation: 'none', ...tagOrientation }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={homeOrientation}
          />
          <Stack.Screen
            name="Random"
            component={RandomScreen}
            options={tagOrientation}
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
                paddingLeft: ios ? paddingLeft : paddingHorizontal,
                paddingRight: ios ? paddingRight : paddingHorizontal,
              },
              headerTitleAlign: 'center',
            }}
          >
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{
                headerShown: false,
                contentStyle: {
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                ...homeOrientation,
              }}
            />
            <Stack.Screen
              name="TagLabels"
              component={TagLabels}
              options={{
                title: 'labels',
                header: navHeader(true),
                ...tagOrientation,
              }}
            />
            <Stack.Screen
              name="CreateLabel"
              component={CreateLabel}
              options={{
                title: 'new label',
                headerBackTitle: 'cancel',
                header: navHeader(true),
                orientation: 'all',
              }}
            />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  )
}
