import homeIcon from "@app/components/homeIcon"
import Logo from "@app/components/Logo"
import useShallowScreen from "@app/hooks/useShallowScreen"
import {HomeNavigatorScreenProps} from "@app/navigation/navigationParams"
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native"
import {Divider, List, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

/**
 * Home screen
 */
export default function HomeScreen({
  navigation,
}: HomeNavigatorScreenProps<"Home">) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const shallow = useShallowScreen()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 5,
      alignItems: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 10),
      paddingHorizontal: 15,
    },
    buttonHolder: {
      paddingLeft: insets.left,
      alignItems: "flex-start",
    },
    logoHolder: {
      justifyContent: "center",
      paddingLeft: insets.left,
      flexBasis: 50,
      marginBottom: 5,
    },
    navHolder: {
      flex: 1,
      width: "100%",
      marginVertical: 5,
      paddingVertical: 5,
    },
    subheader: {
      marginLeft: 0,
      paddingBottom: 5,
      marginBottom: 0,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      // borderColor: "red",
      // borderWidth: 1,
      height: 50,
      flexDirection: "row",
      paddingLeft: 5,
      paddingRight: 0,
    },
  })

  return (
    <View style={styles.container} testID="home_container">
      {shallow ? null : (
        <View style={styles.logoHolder}>
          <Logo size={30} dark />
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.listHolder}>
          <TouchableOpacity onPress={() => navigation.navigate("Popular")}>
            <List.Item
              title="popular tags"
              left={PopularIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate("Classic")}>
            <List.Item
              title="classic tags"
              left={ClassicIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate("Easy")}>
            <List.Item
              title="easy tags"
              left={EasyIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.listHolder}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Labels")
            }}>
            <List.Item
              title="labels"
              left={LabelsIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.listHolder}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("About")
            }}>
            <List.Item
              title="about"
              left={AboutIcon}
              testID="about_button"
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Options")
            }}>
            <List.Item
              title="options"
              left={OptionsIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Share")
            }}>
            <List.Item
              title="share"
              left={ShareIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const PopularIcon = homeIcon("star")
const ClassicIcon = homeIcon("pillar")
const EasyIcon = homeIcon("teddy-bear")
const RightIcon = homeIcon("chevron-right")
const LabelsIcon = homeIcon("tag-multiple-outline")
const AboutIcon = homeIcon("information-outline")
const OptionsIcon = homeIcon("cog-outline")
const ShareIcon = homeIcon("share")
