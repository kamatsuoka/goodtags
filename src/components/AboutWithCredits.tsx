import {Linking, StyleSheet, TextStyle, View, ViewStyle} from "react-native"
import {Button, Text, useTheme} from "react-native-paper"
import AboutBase from "./AboutBase"

type LinkButtonParams = {
  url: string
  label: string
  labelStyle: TextStyle
  contentStyle: ViewStyle
}

function LinkButton(props: LinkButtonParams) {
  return (
    <Button
      mode="text"
      labelStyle={props.labelStyle}
      contentStyle={props.contentStyle}
      onPress={() => Linking.openURL(props.url)}>
      {props.label}
    </Button>
  )
}

export default function AboutWithCredits() {
  const theme = useTheme()

  const styles = StyleSheet.create({
    body: {
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.primary,
    },
    homepage: {
      flexDirection: "row",
      paddingTop: 2,
      paddingHorizontal: 20,
    },
    text: {
      color: theme.colors.surfaceVariant,
      lineHeight: 20,
      margin: 5,
    },
    credits: {
      alignItems: "center",
      padding: 20,
    },
    buttonLabel: {
      color: theme.colors.onPrimary,
      fontSize: 15,
      textDecorationLine: "underline",
    },
    buttonContent: {
      flexDirection: "row-reverse",
      alignItems: "baseline",
    },
    text2: {
      color: theme.colors.outlineVariant,
      fontSize: 13,
    },
    buttonLabel2: {
      marginTop: 0,
      color: theme.colors.outlineVariant,
      fontSize: 13,
      textDecorationLine: "underline",
    },
    button2: {
      margin: 0,
    },
    buttonContent2: {
      marginTop: 4,
      padding: 0,
    },
  })

  return (
    <View style={styles.body}>
      <AboutBase />
      <View style={styles.homepage}>
        <LinkButton
          url="https://goodtags.net/"
          label="goodtags.net"
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        />
      </View>
      <View style={styles.credits}>
        <Text style={styles.text2}>Content hosted by</Text>
        <LinkButton
          url="https://www.barbershoptags.com/"
          label="barbershoptags.com"
          labelStyle={styles.buttonLabel2}
          contentStyle={styles.buttonContent2}
        />
      </View>
    </View>
  )
}
