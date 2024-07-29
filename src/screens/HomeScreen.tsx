// import {StackParamList} from "@app/navigation/navigationParams"
import Logo from "@app/components/Logo"
import {useAppDispatch, useAppSelector} from "@app/hooks"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {StackParamList} from "@app/navigation/navigationParams"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {StyleSheet, TouchableOpacity, View} from "react-native"
import {Button, List, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

/**
 * About goodtags
 */
export default function HomeScreen() {
  const theme = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const insets = useSafeAreaInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  // const tagIdsByLabel = useAppSelector(state => state.favorites.tagIdsByLabel)
  const dispatch = useAppDispatch()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 5,
      alignItems: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 20),
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
    <View style={styles.container} testID="drawer_container">
      <View style={styles.logoHolder}>
        <Logo size={30} dark />
      </View>
      <List.Section>
        <List.Subheader style={styles.subheader}>COLLECTIONS</List.Subheader>
        <View style={styles.listHolder}>
          <TouchableOpacity
            style={styles.listHolder}
            onPress={() => navigation.navigate("Popular")}>
            <List.Item
              title="popular tags"
              left={PopularIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
      </List.Section>
      <List.Section>
        <List.Subheader style={styles.subheader}>LABELS</List.Subheader>
        <View style={styles.listHolder}>
          {labels.map((label, index) => (
            <View style={styles.listHolder} key={`label_${index}`}>
              <TouchableOpacity
                style={styles.listHolder}
                onPress={() => {
                  dispatch(FavoritesActions.selectLabel(label))
                  navigation.navigate("Label", {label})
                }}>
                <List.Item
                  title={label}
                  left={LabelIcon}
                  right={RightIcon}
                  style={styles.listItem}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </List.Section>
      <View style={styles.buttonHolder}>
        <Button
          icon="label-multiple-outline"
          onPress={() => navigation.navigate("LabelEditor")}>
          edit labels
        </Button>
        <Button
          icon="information-outline"
          onPress={() => navigation.navigate("About")}
          testID="about_button">
          about
        </Button>
        <Button
          icon="cog-outline"
          onPress={() => navigation.navigate("Options")}>
          options
        </Button>
      </View>
    </View>
  )
}

function homeIcon(name: string, size: number = 20) {
  return () => <Icon name={name} size={size} />
}

const PopularIcon = homeIcon("download")
const RightIcon = homeIcon("chevron-right")
const LabelIcon = homeIcon("label")
