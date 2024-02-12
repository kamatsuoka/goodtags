import useHaptics from "@app/hooks/useHaptics"
import useShallowScreen from "@app/hooks/useShallowScreen"
import {TabBarBackground} from "@app/lib/theme"
import {DrawerActions, useNavigation} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {ImpactFeedbackStyle} from "expo-haptics"
import React from "react"
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import {IconButton, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import useHeaderHeight from "../hooks/useHeaderHeight"
import {NoteHandler} from "../lib/NoteHandler"

const noteHandler = new NoteHandler("g")

type ListHeaderProps = {
  // reference to FlashList with tags
  listRef: React.RefObject<FlashList<number>>
}

const LOGO_SIZE = 30
const BUTTON_SIZE = LOGO_SIZE + 10

/**
 * Header to go atop tag list
 */
export default function ListHeader(props: ListHeaderProps) {
  const theme = useTheme()
  const headerHeight = useHeaderHeight()
  const haptics = useHaptics()
  const shallowScreen = useShallowScreen()
  const {listRef} = props
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: theme.colors.onPrimary,
    },
    header: {
      ...styles.header,
      height: headerHeight,
    },
  })

  const shallowScreenStyle = {
    height: Platform.OS === "android" ? insets.top : 0,
  }

  // don't show header on shallow screens
  return shallowScreen ? (
    <View style={shallowScreenStyle} />
  ) : (
    <>
      <TouchableWithoutFeedback
        onPress={async () => {
          await haptics.impactAsync(ImpactFeedbackStyle.Light)
          listRef.current!.scrollToIndex({
            index: 0,
            animated: true,
          })
        }}>
        <View style={themedStyles.header}>
          <IconButton
            icon={require("../assets/images/g-bold-40.png")}
            iconColor={theme.colors.onPrimaryContainer}
            size={LOGO_SIZE}
            style={themedStyles.logoButton}
            mode="contained"
            onPress={async () => {
              navigation.dispatch(DrawerActions.openDrawer())
            }}
            onLongPress={async () => {
              noteHandler.onPressIn()
            }}
            onPressOut={async () => {
              noteHandler.onPressOut()
            }}
            testID="logo_button"
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-end",
    backgroundColor: TabBarBackground,
    flexDirection: "row",
    justifyContent: "flex-start",
    opacity: 0.9,
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
})
