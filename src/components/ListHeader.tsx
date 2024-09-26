import {useBodyInsets} from "@app/hooks"
import {TabBarBackground} from "@app/lib/theme"
import {FlashList} from "@shopify/flash-list"
import React from "react"
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native"
import {Text} from "react-native-paper"
import useHeaderHeight from "../hooks/useHeaderHeight"
import BackButton from "./BackButton"
import homeIcon from "./homeIcon"

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashList<number>>
  showBackButton?: boolean
  title?: string | React.ReactNode
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
  const {paddingLeft} = useBodyInsets()
  const headerHeight = useHeaderHeight()

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: "transparent",
    },
    header: {
      ...styles.header,
      height: headerHeight,
      paddingLeft,
    },
  })

  const backButton = showBackButton ? (
    <>
      <TouchableWithoutFeedback
        onPress={async () => {
          listRef.current!.scrollToIndex({
            index: 0,
            animated: true,
          })
        }}>
        <BackButton />
      </TouchableWithoutFeedback>
    </>
  ) : (
    <View style={styles.spacer} />
  )

  const titleComponent =
    typeof title === "string" ? (
      <View style={styles.titleHolder}>
        {titleIcon ? homeIcon(titleIcon)() : null}
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      </View>
    ) : (
      title
    )

  return (
    <View style={themedStyles.header}>
      {backButton}
      {titleComponent}
      <View style={styles.spacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-end",
    backgroundColor: TabBarBackground,
    flexDirection: "row",
    justifyContent: "space-between",
    opacity: 0.9,
    paddingHorizontal: 10,
    height: 55,
  },
  spacer: {
    width: 50,
  },
  titleHolder: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  title: {
    marginLeft: 5,
  },
})
