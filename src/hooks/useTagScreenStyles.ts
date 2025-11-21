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
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonHolder: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    alignItems: 'flex-start',
  },
  actionBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fabDown: {
    ...CommonStyles.fabDown,
    marginBottom: 20,
  },
  fabGroup: {
    zIndex: 1000,
    elevation: 1000,
  },
  noteIcon: {
    margin: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    left: 10,
  },
  backButton: {
    backgroundColor: IdBackground,
    margin: 0,
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
      paddingVertical: 4,
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
    // avoid split screen controls interfering with favorite button on iPad
    ...(iPad ? { left: 120 } : { left: 0, right: 0 }),
  }

  const fabGroupStyle = {
    ...baseStyles.fabGroup,
    marginTop: 10,
  }

  const backButtonStyle = {
    ...baseStyles.backButton,
    marginTop: -24,
    marginLeft: -10,
  }

  const bottomActionBarStyle = {
    ...baseStyles.actionBar,
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
