import {useBodyInsets, useHorizontalInset} from "@app/hooks"
import {TabBarBackground} from "@app/lib/theme"
import {getHeaderTitle} from "@react-navigation/elements"
import {useNavigation} from "@react-navigation/native"
import {NativeStackHeaderProps} from "@react-navigation/native-stack"
import React from "react"
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import {Text} from "react-native-paper"
import useHeaderHeight from "../hooks/useHeaderHeight"
import BackButton from "./BackButton"
import homeIcon from "./homeIcon"

type CommonHeaderProps = {
  backType?: BackType
  title?: string | React.ReactNode
  titleIcon?: string
  insetHeader?: boolean
}

const LOGO_SIZE = 30
const BUTTON_SIZE = LOGO_SIZE + 10

export enum BackType {
  Back,
  Cancel,
}

export const navHeader =
  (insetHeader: boolean) => (props: NativeStackHeaderProps) => {
    const title = getHeaderTitle(props.options, props.route.name)
    const backType =
      props.options.headerBackTitle === "cancel"
        ? BackType.Cancel
        : BackType.Back
    return (
      <CommonHeader
        title={title}
        backType={backType}
        insetHeader={insetHeader}
      />
    )
  }

/**
 * Header to go atop tag list
 */
export default function CommonHeader({
  backType = BackType.Back,
  title = "",
  titleIcon = "",
  insetHeader = false,
}: CommonHeaderProps) {
  const {paddingLeft} = useBodyInsets()
  const headerInset = useHorizontalInset()
  const navigation = useNavigation()
  const headerHeight = useHeaderHeight()
  const ios = Platform.OS === "ios"

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: "transparent",
    },
    header: {
      ...styles.header,
      height: headerHeight,
      paddingHorizontal: ios ? paddingLeft : 0,
      marginHorizontal: !ios && insetHeader ? headerInset : 0,
    },
  })

  const backButton = () => {
    if (backType === BackType.Cancel) {
      return (
        <Text style={styles.cancel} onPress={navigation.goBack}>
          cancel
        </Text>
      )
    }
    if (backType === BackType.Back) {
      return (
        <TouchableWithoutFeedback>
          <BackButton />
        </TouchableWithoutFeedback>
      )
    }
    return <View style={styles.spacer} />
  }

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
      {backButton()}
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
  },
  cancel: {
    marginLeft: 10,
    marginBottom: 12,
  },
  spacer: {
    width: 50,
  },
  titleHolder: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    marginLeft: 5,
  },
})
