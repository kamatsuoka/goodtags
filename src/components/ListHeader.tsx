import { useHeaderHeight } from '@app/hooks'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import React, { ComponentProps } from 'react'
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from './BackButton'
import homeIcon from './homeIcon'

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
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const ios = Platform.OS === 'ios'

  const themedStyles = StyleSheet.create({
    header: {
      ...styles.header,
      height: headerHeight,
      paddingTop: insets.top,
      paddingBottom: 10,
      backgroundColor: theme.colors.primary,
    },
    titleHolder: {
      ...styles.titleHolder,
    },
    title: {
      ...styles.title,
      color: theme.colors.onPrimary,
    },
    icon: {
      color: theme.colors.onPrimary,
      marginRight: 8,
      marginBottom: ios ? 4 : 0,
    },
  })

  const backButton = showBackButton ? (
    <BackButton />
  ) : (
    <View style={styles.spacer} />
  )

  const maybeWrappedTitle: React.ReactNode =
    typeof title === 'string' ? (
      <View style={themedStyles.titleHolder}>
        {titleIcon
          ? homeIcon(titleIcon, 22)({ style: themedStyles.icon })
          : null}
        <Text variant="titleLarge" style={themedStyles.title}>
          {title}
        </Text>
      </View>
    ) : (
      title
    )

  const scrollToTop = async () => {
    listRef.current!.scrollToIndex({
      index: 0,
      animated: true,
    })
  }

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View style={themedStyles.header}>
        <View style={styles.leftSection}>{backButton}</View>
        <View style={styles.centerSection}>{maybeWrappedTitle}</View>
        <View style={styles.rightSection} />
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
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
  },
  spacer: {
    width: 50,
  },
  titleHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginLeft: 5,
  },
})
