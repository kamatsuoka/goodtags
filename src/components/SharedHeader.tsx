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
  Cancel,
  None,
}

type SharedHeaderProps = {
  // Title
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']

  // Back button
  backType?: BackType
  onBack?: () => void

  // Right side content
  headerRight?: (props: any) => React.ReactNode

  // Layout options
  absolute?: boolean // Position absolute for overlays (TagLayout)

  // List-specific props
  listRef?: React.RefObject<FlashListRef<number> | null>
  enableScrollToTop?: boolean

  // Style overrides
  headerStyle?: any
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto'
}

/**
 * Unified header component for the entire app.
 * Uses a consistent three-column layout across all use cases.
 */
export default function SharedHeader({
  title = '',
  titleIcon,
  backType = BackType.None,
  onBack,
  headerRight,
  absolute = false,
  listRef,
  enableScrollToTop = false,
  headerStyle,
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
      marginBottom: absolute ? 0 : 5,
      ...(absolute
        ? {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          }
        : {}),
      ...headerStyle,
    },
    titleHolder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
    if (backType === BackType.Cancel) {
      return (
        <Text style={themedStyles.cancel} onPress={onBack}>
          cancel
        </Text>
      )
    }
    if (backType === BackType.Back) {
      return <BackButton onBack={onBack} />
    }
    return <View style={styles.spacer} />
  }

  const renderTitle = () => {
    if (typeof title === 'string') {
      return (
        <View style={themedStyles.titleHolder}>
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
      <View style={styles.leftSection}>{renderBackButton()}</View>
      <View style={styles.centerSection}>{renderTitle()}</View>
      <View style={styles.rightSection}>
        {headerRight ? headerRight({}) : null}
      </View>
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
  leftSection: {
    minWidth: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 48,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  rightSection: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 48,
  },
  spacer: {
    width: 50,
  },
})
