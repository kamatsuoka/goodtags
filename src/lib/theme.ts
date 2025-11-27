import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native'
import {
  MD3LightTheme,
  adaptNavigationTheme,
  configureFonts,
} from 'react-native-paper'

import merge from 'deepmerge'
import { Platform } from 'react-native'

process.env.EXPO_OS = Platform.OS

const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
})

const CombinedLightTheme = merge(MD3LightTheme, LightTheme)

const CombinedTheme = {
  ...CombinedLightTheme,
}

CombinedTheme.colors = {
  ...CombinedTheme.colors,
  primary: 'rgb(38, 94, 167)',
  onPrimary: 'rgb(255, 255, 255)',
  primaryContainer: 'rgb(214, 227, 255)',
  onPrimaryContainer: 'rgb(0, 27, 61)',
  secondary: 'rgb(85, 95, 113)',
  onSecondary: 'rgb(255, 255, 255)',
  secondaryContainer: 'rgb(217, 227, 248)',
  onSecondaryContainer: 'rgb(18, 28, 43)',
  tertiary: 'rgb(111, 86, 117)',
  onTertiary: 'rgb(255, 255, 255)',
  tertiaryContainer: 'rgb(249, 216, 254)',
  onTertiaryContainer: 'rgb(40, 19, 47)',
  error: 'rgb(186, 26, 26)',
  onError: 'rgb(255, 255, 255)',
  errorContainer: 'rgb(255, 218, 214)',
  onErrorContainer: 'rgb(65, 0, 2)',
  background: 'rgb(253, 251, 255)',
  onBackground: 'rgb(26, 27, 30)',
  surface: 'rgb(253, 251, 255)',
  onSurface: 'rgb(26, 27, 30)',
  surfaceVariant: 'rgb(224, 226, 236)',
  onSurfaceVariant: 'rgb(67, 71, 78)',
  outline: 'rgb(116, 119, 127)',
  outlineVariant: 'rgb(196, 198, 207)',
  shadow: 'rgb(0, 0, 0)',
  scrim: 'rgb(0, 0, 0)',
  inverseSurface: 'rgb(47, 48, 51)',
  inverseOnSurface: 'rgb(241, 240, 244)',
  inversePrimary: 'rgb(168, 200, 255)',
  elevation: {
    level0: 'transparent',
    level1: 'rgb(242, 243, 251)',
    level2: 'rgb(236, 238, 248)',
    level3: 'rgb(229, 234, 245)',
    level4: 'rgb(227, 232, 244)',
    level5: 'rgb(223, 229, 243)',
  },
  surfaceDisabled: 'rgba(26, 27, 30, 0.12)',
  onSurfaceDisabled: 'rgba(26, 27, 30, 0.38)',
  backdrop: 'rgba(45, 48, 56, 0.8)',
}

CombinedTheme.roundness = 9

export const TabBarBackground = CombinedTheme.colors.elevation.level1
export const TabBarActiveColor = 'rgb(33, 150, 243)' // Vibrant blue for active tab
export const InversePrimaryLowAlpha = 'rgba(168, 200, 255, 0.2)'
export const InversePrimaryHighAlpha = 'rgba(168, 200, 255, 0.8)'
export const IdBackground = 'rgba(255, 255, 255)'

export const LogoFont = 'Vollkorn-Black'

const FontRegular = 'Vollkorn-Regular'
const fontConfig = {
  fontFamily: FontRegular,
}
export const MainTheme = {
  ...CombinedTheme,
  fonts: configureFonts({
    config: fontConfig,
  }),
}
const SansRegular = 'Lato-Regular'
const sansFontConfig = {
  fontFamily: SansRegular,
}
export const SansSerifTheme = {
  ...CombinedTheme,
  fonts: configureFonts({
    config: sansFontConfig,
  }),
}
