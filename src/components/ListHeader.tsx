import { useBodyInsets } from '@app/hooks'
import { TabBarBackground } from '@app/lib/theme'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { FlashListRef } from '@shopify/flash-list'
import React, { ComponentProps } from 'react'
import {
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useHeaderHeight from '../hooks/useHeaderHeight'
import BackButton from './BackButton'
import homeIcon from './homeIcon'

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashListRef<number> | null>
  showBackButton?: boolean
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
}

const LOGO_SIZE = 30
const BUTTON_SIZE = LOGO_SIZE + 10

/**
 * Header to go atop tag list
 */
export default function ListHeader({
  listRef,
  showBackButton = false,
  title = '',
  titleIcon,
}: ListHeaderProps) {
  const { paddingLeft } = useBodyInsets()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const { width, height } = Dimensions.get('window')
  const isPortrait = height > width

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: 'transparent',
    },
    header: {
      ...styles.header,
      height: headerHeight,
      paddingTop: insets.top,
    },
    leftSpacer: {
      ...styles.leftSpacer,
      left: paddingLeft,
    },
    titleHolder: {
      ...styles.titleHolder,
      paddingBottom: isPortrait ? 7 : 0,
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
        {titleIcon ? homeIcon(titleIcon)() : null}
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      </View>
    ) : (
      title
    )

  const titleComponent = (
    <TouchableWithoutFeedback
      onPress={async () => {
        listRef.current!.scrollToIndex({
          index: 0,
          animated: true,
        })
      }}
    >
      {maybeWrappedTitle}
    </TouchableWithoutFeedback>
  )

  return (
    <View style={themedStyles.header}>
      <View style={themedStyles.leftSpacer}>{backButton}</View>
      {titleComponent}
      <View style={styles.rightSpacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: TabBarBackground,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 55,
  },
  spacer: {
    width: 50,
  },
  leftSpacer: {
    position: 'absolute',
    left: 10,
    bottom: 0,
  },
  rightSpacer: {
    position: 'absolute',
    right: 10,
    width: 50,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  title: {
    marginLeft: 5,
  },
})
