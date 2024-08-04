import useHaptics from "@app/hooks/useHaptics"
import {TabBarBackground} from "@app/lib/theme"
import {useNavigation} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {ImpactFeedbackStyle} from "expo-haptics"
import React from "react"
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native"
import {IconButton, Text, useTheme} from "react-native-paper"
import useHeaderHeight from "../hooks/useHeaderHeight"
import homeIcon from "./homeIcon"

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashList<number>>
  showBackButton?: boolean
  title?: string
  titleIcon?: string
}

const LOGO_SIZE = 30
const BUTTON_SIZE = LOGO_SIZE + 10

/**
 * Header to go atop tag list
 */
export default function ListHeader({
  listRef,
  showBackButton = false,
  title = "",
  titleIcon = "",
}: ListHeaderProps) {
  const theme = useTheme()
  const headerHeight = useHeaderHeight()
  const haptics = useHaptics()
  const navigation = useNavigation()

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: "transparent",
    },
    header: {
      ...styles.header,
      height: headerHeight,
    },
  })

  // don't show header on shallow screens
  const backButton = showBackButton ? (
    <>
      <TouchableWithoutFeedback
        onPress={async () => {
          await haptics.impactAsync(ImpactFeedbackStyle.Light)
          listRef.current!.scrollToIndex({
            index: 0,
            animated: true,
          })
        }}>
        <IconButton
          icon="chevron-left"
          iconColor={theme.colors.onPrimaryContainer}
          size={LOGO_SIZE}
          style={themedStyles.logoButton}
          mode="contained"
          onPress={() => navigation.goBack()}
          testID="logo_button"
        />
      </TouchableWithoutFeedback>
    </>
  ) : (
    <View style={styles.spacer} />
  )
  return (
    <View style={styles.header}>
      {backButton}
      <View style={styles.titleHolder}>
        {titleIcon ? homeIcon(titleIcon)() : null}
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.spacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: TabBarBackground,
    flexDirection: "row",
    justifyContent: "space-between",
    opacity: 0.9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    height: 65,
  },
  spacer: {
    width: 30,
  },
  titleHolder: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    marginLeft: 5,
  },
})
