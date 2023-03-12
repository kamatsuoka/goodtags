import {useAppDispatch, useAppSelector} from "@app/hooks"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {TabsParamList} from "@app/navigation/navigationParams"
import {FAVORITES_TAB_INDEX} from "@app/navigation/TabNavigator"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {StyleSheet} from "react-native"
import {Drawer, Text, useTheme} from "react-native-paper"

import {DrawerContentScrollView} from "@react-navigation/drawer"

/**
 * Shows a list of labels and their counts.
 */
export default function LabelNavigator() {
  const navigation = useNavigation<NativeStackNavigationProp<TabsParamList>>()
  // const [tabIndex, setTabIndex] = useState<number | undefined>(0)
  const labels = useAppSelector(state => state.favorites.labels)
  const tagIdsByLabel = useAppSelector(state => state.favorites.tagIdsByLabel)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const theme = useTheme()
  const dispatch = useAppDispatch()

  const labelCount = (label: string) => {
    const ids = tagIdsByLabel[label]
    const count = ids ? ids.length : 0
    return count ? <Text>{count}</Text> : null
  }

  const styles = StyleSheet.create({
    drawerContent: {
      paddingTop: 0,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    createButton: {
      alignSelf: "flex-start",
      margin: 15,
    },
    scrollHolder: {
      flex: 1,
    },
    drawerItem: {
      height: 38,
      borderRadius: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: 0,
      color: theme.colors.onSurface,
    },
    title: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 40,
    },
  })
  /**
   * If we're on the favorites tab and the currently selected label is pressed,
   * unselect it. Otherwise, select the new label.
   */
  const handleLabelPress = (label: string) => {
    const tabIndex =
      navigation.getState().routes[0].state?.routes[0].state?.index
    if (label === selectedLabel && tabIndex === FAVORITES_TAB_INDEX) {
      dispatch(FavoritesActions.unselectLabel())
    } else {
      dispatch(FavoritesActions.selectLabel(label))
      navigation.navigate("Favorites", {label})
    }
  }

  return (
    <DrawerContentScrollView contentContainerStyle={styles.drawerContent}>
      {/* <View style={styles.container}> */}
      {labels.map((label, index) => {
        return (
          <Drawer.Item
            icon={label === selectedLabel ? "label" : "label-outline"}
            key={`label${index}`}
            label={label}
            right={() => labelCount(label)}
            onPress={() => handleLabelPress(label)}
            style={styles.drawerItem}
          />
        )
      })}
      {/* </View> */}
    </DrawerContentScrollView>
  )
}
