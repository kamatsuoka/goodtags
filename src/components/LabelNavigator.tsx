import {useAppDispatch, useAppSelector} from "@app/hooks"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {TabsParamList} from "@app/navigation/navigationParams"
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
  const numFavorites = useAppSelector(state => state.favorites.allTagIds.length)
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
   * If we're on the library tab and the currently selected label is pressed,
   * just close the navigator. Otherwise, select the new label.
   */
  const handleLabelPress = (label?: string) => {
    if (label) {
      dispatch(FavoritesActions.selectLabel(label))
    } else {
      dispatch(FavoritesActions.unselectLabel())
    }
    navigation.navigate("Library", {label})
  }

  const favoriteCount = () => <Text>{numFavorites}</Text>

  return (
    <DrawerContentScrollView contentContainerStyle={styles.drawerContent}>
      <Drawer.Item
        icon={selectedLabel ? "heart-outline" : "heart"}
        label="favorites"
        right={() => favoriteCount()}
        onPress={() => handleLabelPress()}
        style={styles.drawerItem}
      />
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
    </DrawerContentScrollView>
  )
}
