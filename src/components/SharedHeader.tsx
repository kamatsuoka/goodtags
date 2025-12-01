import { useHeaderHeight } from '@app/hooks'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import React, { ComponentProps } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
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
  listRef?: React.RefObject<FlashListRef<number> | null>
  enableScrollToTop?: boolean
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
  headerStyle,
  headerCenterStyle,
  pointerEvents = 'auto',
}: SharedHeaderProps) {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  const themedStyles = StyleSheet.create({
    header: {
      backgroundColor: theme.colors.primary,
      height: headerHeight,
      paddingTop: insets.top,
      paddingLeft: insets.left + 10,
      paddingRight: insets.right + 10,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'flex-end',
      ...headerStyle,
    },
    center: {
      ...styles.center,
      ...headerCenterStyle,
    },
    title: {
      color: theme.colors.onPrimary,
      marginLeft: 5,
    },
    icon: {
      color: theme.colors.onPrimary,
      marginRight: 8,
    },
    cancel: {
      color: theme.colors.onPrimary,
      marginBottom: 12,
    },
  })

  const scrollToTop = () => {
    if (listRef?.current && enableScrollToTop) {
      listRef.current.scrollToIndex({
        index: 0,
        animated: true,
      })
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
            ? homeIcon(titleIcon, 22)({ style: themedStyles.icon })
            : null}
          <Text variant="titleLarge" style={themedStyles.title}>
            {title}
          </Text>
        </View>
      )
    }
    return title
  }

  const content = (
    <View style={themedStyles.header} pointerEvents={pointerEvents}>
      <View style={styles.left}>{renderBackButton()}</View>
      <View style={themedStyles.center}>{renderTitle()}</View>
      <View style={styles.right}>{headerRight ? headerRight({}) : null}</View>
    </View>
  )

  if (enableScrollToTop) {
    return (
      <TouchableWithoutFeedback onPress={scrollToTop}>
        {content}
      </TouchableWithoutFeedback>
    )
  }

  return content
}

const styles = StyleSheet.create({
  left: {
    minWidth: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  titleHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 48,
  },
  spacer: {
    width: 50,
  },
})
