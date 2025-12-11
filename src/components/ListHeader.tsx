import { HEADER_BUTTON_SIZE, SMALL_ICON_SIZE } from '@app/constants/CommonStyles'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import { ComponentProps, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { IconButton } from 'react-native-paper'
import { useTheme } from 'react-native-paper/lib/module/index'
import SharedHeader, { BackType } from './SharedHeader'

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashListRef<number> | null>
  showBackButton?: boolean
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
  setFabOpen: (open: boolean) => void
  headerCenterStyle?: any
}

/**
 * Header to go atop tag list
 */
export default function ListHeader({
  listRef,
  showBackButton = false,
  title = '',
  titleIcon,
  setFabOpen,
  headerCenterStyle,
}: ListHeaderProps) {
  const theme = useTheme()
  const headerRight = useCallback(
    (_props: any) => (
      <View style={styles.headerRight}>
        <IconButton
          icon="menu"
          size={SMALL_ICON_SIZE}
          style={styles.menuButton}
          onPress={() => setFabOpen(true)}
          iconColor={theme.colors.onPrimary}
        />
      </View>
    ),
    [setFabOpen, theme.colors.onPrimary],
  )

  return (
    <SharedHeader
      title={title}
      titleIcon={titleIcon}
      backType={showBackButton ? BackType.Back : BackType.None}
      listRef={listRef}
      enableScrollToTop
      headerRight={headerRight}
      headerCenterStyle={headerCenterStyle}
    />
  )
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    height: HEADER_BUTTON_SIZE,
  },
  menuButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    backgroundColor: 'transparent',
    margin: 0,
  },
})
