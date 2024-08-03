import homeIcon from "@app/components/homeIcon"
import Logo from "@app/components/Logo"
import {HomeParamList} from "@app/navigation/navigationParams"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native"
import {Divider, List, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

/**
 * About goodtags
 */
export default function HomeScreen() {
  const theme = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<HomeParamList>>()
  const insets = useSafeAreaInsets()

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
      <View style={styles.logoHolder}>
        <Logo size={30} dark />
      </View>
      <ScrollView style={styles.scrollView}>
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
          <TouchableOpacity onPress={() => navigation.navigate("Popular")}>
            <List.Item
              title="classic tags"
              left={ClassicIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate("Popular")}>
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
              left={LabelIcon}
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
        </View>
      </ScrollView>
    </View>
  )
}

const PopularIcon = homeIcon("star-outline")
const ClassicIcon = homeIcon("pillar")
const EasyIcon = homeIcon("teddy-bear")
const RightIcon = homeIcon("chevron-right")
const LabelIcon = homeIcon("label")
const AboutIcon = homeIcon("information-outline")
const OptionsIcon = homeIcon("cog-outline")
