import { Platform, StyleSheet } from 'react-native'
import { isTablet } from 'react-native-device-info'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CommonStyles from '../constants/CommonStyles'
import { IdBackground, InversePrimaryLowAlpha } from '../lib/theme'

const BUTTON_DIM_OPACITY = 0.5

const baseStyles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 3,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  actionBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 80,
  },
  fabDown: {
    ...CommonStyles.fabDown,
    marginBottom: 20,
  },
  fabGroup: {
    paddingTop: 21,
    paddingRight: 16,
  },
  noteIcon: {
    position: 'absolute',
    margin: 20,
    left: 0,
    bottom: 56,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    left: 10,
  },
  backButton: {
    backgroundColor: IdBackground,
  },
  iconHolder: {
    backgroundColor: InversePrimaryLowAlpha,
  },
})

export const useTagScreenStyles = (buttonsDimmed: boolean) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const iPad = ios && isTablet()

  const themedStyles = StyleSheet.create({
    id: {
      color: theme.colors.primary,
      fontSize: 18,
      marginRight: 7,
    },
    idHolder: {
      alignItems: 'baseline',
      backgroundColor: IdBackground,
      borderRadius: 7,
      borderColor: theme.colors.secondaryContainer,
      borderWidth: 2,
      flexDirection: 'row',
      paddingHorizontal: 7,
      paddingBottom: 4,
      paddingVertical: ios ? 4 : 0,
    },
    modal: {
      ...CommonStyles.modal,
      borderWidth: 1,
      backgroundColor: theme.colors.backdrop,
    },
    videoModal: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backdrop,
    },
    iconHolderDim: {
      backgroundColor: theme.colors.inverseOnSurface,
      opacity: BUTTON_DIM_OPACITY,
    },
    iconHolderBright: {
      backgroundColor: theme.colors.inverseOnSurface,
      opacity: 1.0,
    },
  })

  const topBarStyle = {
    ...baseStyles.topBar,
    paddingTop: insets.top,
    // avoid split screen controls interfering with favorite button on iPad
    ...(iPad ? { left: 120 } : { left: 0, right: 0 }),
  }

  const fabGroupStyle = {
    ...baseStyles.fabGroup,
    marginTop: ios ? 0 : insets.top - baseStyles.fabGroup.paddingTop,
    marginRight: ios ? 0 : insets.right - baseStyles.fabGroup.paddingRight,
  }

  const backButtonStyle = {
    ...baseStyles.backButton,
    marginTop: ios ? 0 : insets.top + 15,
    marginLeft: ios ? 0 : insets.left,
  }

  const bottomActionBarStyle = {
    ...baseStyles.actionBar,
    marginBottom: ios ? 0 : insets.bottom,
    marginLeft: ios ? 0 : insets.left,
    marginRight: ios ? 0 : insets.right,
  }

  const modalCloseButtonStyle = ios
    ? baseStyles.closeButton
    : {
        ...baseStyles.closeButton,
        top: baseStyles.closeButton.top + insets.top,
        left: baseStyles.closeButton.left + insets.left,
      }

  const videoModalStyle = StyleSheet.compose(
    themedStyles.modal,
    themedStyles.videoModal,
  )

  const dimmableIconHolderStyle = buttonsDimmed
    ? themedStyles.iconHolderDim
    : themedStyles.iconHolderBright

  return {
    baseStyles,
    themedStyles,
    topBarStyle,
    fabGroupStyle,
    backButtonStyle,
    bottomActionBarStyle,
    modalCloseButtonStyle,
    videoModalStyle,
    dimmableIconHolderStyle,
    ios,
    iPad,
  }
}
