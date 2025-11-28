import { Platform, StyleSheet } from 'react-native'
import { isTablet } from 'react-native-device-info'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CommonStyles from '../constants/CommonStyles'
import { IdBackground, InversePrimaryLowAlpha } from '../lib/theme'

const BUTTON_DIM_OPACITY = 0.5
const MIN_HORIZONTAL_INSET = 12

const baseStyles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarSpacer: {
    flex: 1,
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
    paddingTop: 10,
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
    marginLeft: 14,
  },
  fabButton: {
    backgroundColor: IdBackground,
    marginRight: 14,
  },
  fabHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  iconHolder: {
    backgroundColor: InversePrimaryLowAlpha,
  },
})

export const useTagScreenStyles = (
  buttonsDimmed: boolean,
  fabOpen: boolean,
) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const iPad = ios && isTablet()

  const themedStyles = StyleSheet.create({
    id: {
      color: theme.colors.onPrimary,
      fontSize: iPad ? 26 : 18,
      fontWeight: 'normal',
      marginRight: 7,
    },
    idHolder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      minWidth: iPad ? 80 : 50,
      borderRadius: iPad ? 12 : 8,
      paddingHorizontal: iPad ? 12 : 8,
      paddingVertical: iPad ? 4 : 2,
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
    marginTop: ios ? 6 : Math.min(insets.top, 40),
    marginLeft: Math.max(insets.left, ios ? 0 : MIN_HORIZONTAL_INSET),
    marginRight: Math.max(insets.right, ios ? 0 : MIN_HORIZONTAL_INSET),
  }

  const fabGroupStyle = {
    ...baseStyles.fabGroup,
    paddingTop: ios ? 10 : Math.max(10, insets.top * 0.8),
  }
  const backButtonStyle = baseStyles.backButton
  const fabButtonStyle = baseStyles.fabButton
  const fabHiddenStyle = baseStyles.fabHidden

  const bottomActionBarStyle = {
    ...baseStyles.actionBar,
    position: 'absolute' as const,
    bottom: insets.bottom,
    left: Math.max(insets.left, ios ? 0 : MIN_HORIZONTAL_INSET),
    right: Math.max(insets.right, ios ? 0 : MIN_HORIZONTAL_INSET),
    backgroundColor: 'transparent',
    zIndex: 10,
    opacity: fabOpen ? 0 : 1,
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

  const topBarLeftStyle = {
    ...baseStyles.topBarLeft,
    opacity: fabOpen ? 0 : 1,
  }
  const heartIconStyle = fabOpen ? { display: 'none' } : {}
  const fabIconReplacementStyle = fabOpen ? {} : { display: 'none' }

  return {
    baseStyles,
    themedStyles,
    topBarStyle,
    fabGroupStyle,
    backButtonStyle,
    fabButtonStyle,
    fabHiddenStyle,
    bottomActionBarStyle,
    modalCloseButtonStyle,
    videoModalStyle,
    dimmableIconHolderStyle,
    topBarLeftStyle,
    heartIconStyle,
    fabIconReplacementStyle,
    ios,
    iPad,
  }
}
