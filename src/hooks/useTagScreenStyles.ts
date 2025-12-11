import CommonStyles, { HEADER_BUTTON_SIZE } from '@app/constants/CommonStyles'
import { InversePrimaryLowAlpha } from '@app/lib/theme'
import { Platform, StyleSheet } from 'react-native'
import { isTablet } from 'react-native-device-info'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowShape } from './useWindowShape'

const BUTTON_DIM_OPACITY = 0.5
const MIN_HORIZONTAL_INSET = 12

const baseStyles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerCenter: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  headerSpacer: {
    flex: 1,
    pointerEvents: 'none',
  },
  menuButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    backgroundColor: 'transparent',
    margin: 0,
    borderRadius: HEADER_BUTTON_SIZE / 2,
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
  fabHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  iconHolder: {
    backgroundColor: InversePrimaryLowAlpha,
  },
  headerHolder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export const useTagScreenStyles = (buttonsDimmed: boolean, fabOpen: boolean) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { landscape } = useWindowShape()
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
      justifyContent: 'flex-start',
      backgroundColor: theme.colors.primary,
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
      ...CommonStyles.modal,
      flexDirection: 'row',
      backgroundColor: theme.colors.backdrop,
    },
    fabGroup: {
      ...baseStyles.fabGroup,
      paddingTop: ios ? Math.max(insets.top + 10, 10) : Math.max(10, insets.top * 0.8),
    },
    bottomActionBar: landscape
      ? {
          ...baseStyles.actionBar,
          position: 'absolute',
          bottom: insets.bottom,
          left: Math.max(insets.left, ios ? 0 : MIN_HORIZONTAL_INSET),
          right: Math.max(insets.right, ios ? 0 : MIN_HORIZONTAL_INSET),
          backgroundColor: 'transparent',
          opacity: fabOpen ? 0 : 1,
        }
      : {
          ...baseStyles.actionBar,
          marginBottom: insets.bottom,
        },

    modalCloseButton: ios
      ? baseStyles.closeButton
      : {
          ...baseStyles.closeButton,
          top: baseStyles.closeButton.top + insets.top,
          left: baseStyles.closeButton.left + insets.left,
        },

    dimmableIconHolder: {
      backgroundColor: theme.colors.inverseOnSurface,
      opacity: buttonsDimmed ? BUTTON_DIM_OPACITY : 1.0,
    },
    headerHolder: landscape
      ? baseStyles.headerHolder
      : {
          position: 'relative' as const,
          zIndex: 100,
        },
  })

  return {
    ...baseStyles,
    ...themedStyles,
  }
}
