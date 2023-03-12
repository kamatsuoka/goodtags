import {Modal, useTheme} from "react-native-paper"
import CommonStyles from "../constants/CommonStyles"
import AboutWithCredits from "./AboutWithCredits"
import React, {useEffect} from "react"
import {useNavigation} from "@react-navigation/native"
import {StyleSheet} from "react-native"

type AboutModalProps = {
  visible: boolean
  hide: () => void
}

export default function AboutModal(props: AboutModalProps) {
  const theme = useTheme()
  const navigation = useNavigation()
  const styles = StyleSheet.create({
    modal: {
      ...CommonStyles.modal,
      backgroundColor: theme.colors.surfaceDisabled,
    },
  })

  useEffect(() => {
    return navigation.addListener("blur", props.hide)
  }, [navigation, props.hide])

  return (
    <Modal
      visible={props.visible}
      dismissable={true}
      onDismiss={props.hide}
      style={styles.modal}
      testID="about_modal">
      <AboutWithCredits />
    </Modal>
  )
}
