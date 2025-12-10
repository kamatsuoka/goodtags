import { HEADER_BUTTON_SIZE } from '@app/constants/CommonStyles'
import { useHeaderHeight } from '@app/hooks'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import React, { ComponentProps, useMemo } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from './BackButton'
import homeIcon from './homeIcon'

export enum BackType {
  Back,
  Close,
  None,
}

type SharedHeaderProps = {
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
  backType?: BackType
  onBack?: () => void
  backIconColor?: string
  headerRight?: (props: any) => React.ReactNode
  listRef?: React.RefObject<FlashListRef<any> | null>
  enableScrollToTop?: boolean
  inverted?: boolean
  headerStyle?: any
  headerCenterStyle?: any
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto'
}

/**
 * Unified header component for the entire app.
 * Uses a consistent three-column layout across all use cases.
 */
export default function SharedHeader({
  title = '',
  titleIcon,
  backType = BackType.Back,
  onBack,
  backIconColor,
  headerRight,
  listRef,
  enableScrollToTop = false,
  inverted = false,
  headerStyle,
  headerCenterStyle,
  pointerEvents = 'auto',
}: SharedHeaderProps) {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const ios = Platform.OS === 'ios'

  const headerDynamicStyles = useMemo(
    () => ({
      backgroundColor: theme.colors.primary,
      height: headerHeight,
      paddingTop: insets.top,
      paddingLeft: insets.left + 10,
      paddingRight: insets.right + 10,
      ...headerStyle,
    }),
    [theme.colors.primary, headerHeight, insets, headerStyle],
  )

  const centerDynamicStyles = useMemo(
    () => ({
      marginBottom: ios ? 6 : 10,
      ...headerCenterStyle,
    }),
    [ios, headerCenterStyle],
  )

  const scrollToTop = () => {
    if (listRef?.current && enableScrollToTop) {
      if (inverted) {
        // For inverted lists, scroll to the end (which appears at the top)
        listRef.current.scrollToEnd({ animated: true })
      } else {
        // For normal lists, scroll to offset 0
        listRef.current.scrollToOffset({
          offset: 0,
          animated: true,
        })
      }
    }
  }

  const renderBackButton = () => {
    if (backType === BackType.None) {
      return <View style={styles.spacer} />
    }
    const icon = backType === BackType.Close ? 'close' : 'chevron-left'
    return <BackButton onBack={onBack} iconColor={backIconColor} icon={icon} />
  }

  const renderTitle = () => {
    if (typeof title === 'string') {
      return (
        <View style={styles.titleHolder}>
          {titleIcon
            ? homeIcon(
                titleIcon,
                22,
              )({ style: [styles.icon, { color: theme.colors.onPrimary }] })
            : null}
          <Text variant="titleLarge" style={{ color: theme.colors.onPrimary }}>
            {title}
          </Text>
        </View>
      )
    }
    return title
  }

  const content = (
    <View
      style={[styles.header, headerDynamicStyles]}
      pointerEvents={pointerEvents}
    >
      <View style={styles.left}>{renderBackButton()}</View>
      <View style={[styles.center, centerDynamicStyles]}>{renderTitle()}</View>
      <View style={styles.right}>{headerRight ? headerRight({}) : null}</View>
    </View>
  )

  if (enableScrollToTop) {
    return (
      <Pressable onPress={scrollToTop}>
        <View collapsable={false}>{content}</View>
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  left: {
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: HEADER_BUTTON_SIZE,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: HEADER_BUTTON_SIZE,
  },
  titleHolder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    height: HEADER_BUTTON_SIZE,
  },
  spacer: {
    width: 50,
  },
  icon: {
    marginRight: 8,
  },
})
