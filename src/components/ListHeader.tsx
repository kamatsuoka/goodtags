import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import React, { ComponentProps } from 'react'
import SharedHeader, { BackType } from './SharedHeader'

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashListRef<number> | null>
  showBackButton?: boolean
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
}

/**
 * Header to go atop tag list
 */
export default function ListHeader({
  listRef,
  showBackButton = false,
  title = '',
  titleIcon,
}: ListHeaderProps) {
  return (
    <SharedHeader
      title={title}
      titleIcon={titleIcon}
      backType={showBackButton ? BackType.Back : BackType.None}
      listRef={listRef}
      enableScrollToTop
    />
  )
}
