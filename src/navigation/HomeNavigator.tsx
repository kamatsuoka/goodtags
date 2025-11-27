import BackButton from '@app/components/BackButton'
import { navHeader } from '@app/components/CommonHeader'
import LabelEditor from '@app/components/LabelEditor'
import ClassicScreen from '@app/screens/ClassicScreen'
import DataScreen from '@app/screens/DataScreen'
import EasyScreen from '@app/screens/EasyScreen'
import HomeScreen from '@app/screens/HomeScreen'
import { LabeledScreen } from '@app/screens/LabeledScreen'
import LabelsScreen from '@app/screens/LabelsScreen'
import NewScreen from '@app/screens/NewScreen'
import OptionsScreen from '@app/screens/OptionsScreen'
import PopularScreen from '@app/screens/PopularScreen'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import { useMemo } from 'react'
import { useTheme } from 'react-native-paper'
import { useAppSelector } from '../hooks'
import { HomeNavigatorParamList } from './navigationParams'

const Stack = createNativeStackNavigator<HomeNavigatorParamList>()

/**
 * navigator for home screen, which links to collections, labeled lists, etc
 */
export default function HomeNavigator() {
  const autoRotate = useAppSelector(state => state.options.autoRotate)
  const theme = useTheme()
  //  const insets = useSafeAreaInsets()
  const homeOrientation: NativeStackNavigationOptions = useMemo(
    () => ({
      orientation: autoRotate ? 'portrait_up' : 'all',
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

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Labeled"
        component={LabeledScreen}
        options={{ headerLeft: BackButton, ...homeOrientation }}
      />
      <Stack.Screen
        name="Popular"
        component={PopularScreen}
        options={homeOrientation}
      />
      <Stack.Screen
        name="Classic"
        component={ClassicScreen}
        options={homeOrientation}
      />
      <Stack.Screen
        name="Easy"
        component={EasyScreen}
        options={homeOrientation}
      />
      <Stack.Screen
        name="New"
        component={NewScreen}
        options={homeOrientation}
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
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Labels"
          component={LabelsScreen}
          options={{
            title: 'labels',
            header: navHeader(false),
            ...homeOrientation,
          }}
        />
        <Stack.Screen
          name="LabelEditor"
          component={LabelEditor}
          options={{
            title: 'edit labels',
            header: navHeader(false),
            ...homeOrientation,
          }}
        />
        <Stack.Screen
          name="Options"
          component={OptionsScreen}
          options={{
            title: 'options',
            header: navHeader(false),
            ...homeOrientation,
          }}
        />
        <Stack.Screen
          name="Data"
          component={DataScreen}
          options={{
            title: 'my data',
            header: navHeader(false),
            ...homeOrientation,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  )
}
