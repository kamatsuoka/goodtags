import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import { ComponentProps, useCallback } from 'react'
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
}: ListHeaderProps) {
  const theme = useTheme()
  const headerRight = useCallback(
    (_props: any) => (
      <IconButton
        icon="menu"
        onPress={() => setFabOpen(true)}
        iconColor={theme.colors.onPrimary}
      />
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
    />
  )
}
