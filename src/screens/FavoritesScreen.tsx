import useHaptics from "@app/hooks/useHaptics"
import {
  DrawerParamList,
  RootStackParamList,
} from "@app/navigation/navigationParams"
import {DrawerScreenProps} from "@react-navigation/drawer"
import {CompositeScreenProps, useFocusEffect} from "@react-navigation/native"
import {NativeStackScreenProps} from "@react-navigation/native-stack"
import {FlashList} from "@shopify/flash-list"
import {useCallback, useRef, useState} from "react"
import {StyleSheet, View} from "react-native"
import {Button, useTheme} from "react-native-paper"
import {FABDown} from "../components/FABDown"
import ListHeader from "../components/ListHeader"
import TagList from "../components/TagList"
import CommonStyles from "../constants/CommonStyles"
import {SortOrder} from "../constants/Search"
import {useAppDispatch, useAppSelector} from "../hooks"
import useFabDownStyle from "../hooks/useFabDownStyle"
import {FavoritesActions} from "../modules/favoritesSlice"
import {SORT_ICONS, SORT_LABELS, TagListType} from "../modules/tagLists"

type Props = CompositeScreenProps<
  NativeStackScreenProps<RootStackParamList, "Library">,
  DrawerScreenProps<DrawerParamList>
>

/**
 * Favorites lists and lists of labeled tags.
 */
export const FavoritesScreen = (props: Props) => {
  const {navigation} = props
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.favorites.sortOrder)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const labelSortOrder = useAppSelector(state =>
    selectedLabel ? state.favorites.sortOrderByLabel[selectedLabel] : undefined,
  )

  const dispatch = useAppDispatch()
  const listRef = useRef<FlashList<number>>(null)
  const fabStyleSheet = useFabDownStyle()

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  const order = selectedLabel ? labelSortOrder : sortOrder

  const sortOrders = selectedLabel
    ? [SortOrder.alpha, SortOrder.id]
    : [SortOrder.alpha, SortOrder.newest]

  const fabActions = sortOrders
    .filter(o => o !== order)
    .map(o => {
      return {
        icon: SORT_ICONS[o],
        label:
          o === SortOrder.newest ? "sort by recently added" : SORT_LABELS[o],
        onPress: async () => {
          await haptics.selectionAsync()
          dispatch(
            selectedLabel
              ? FavoritesActions.toggleLabelSortOrder()
              : FavoritesActions.toggleSortOrder(),
          )
        },
      }
    })

  const emptyMessage = selectedLabel
    ? "no tags with this label yet"
    : "tap the heart icon on sheet music to add favorites"
  return (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} />
      <View style={styles.labelHolder}>
        <Button
          icon={selectedLabel ? "label" : "heart"}
          onPress={navigation.openDrawer}
          mode="text"
          compact
          style={styles.labelButton}>
          {selectedLabel || "favorites"}
        </Button>
      </View>
      <TagList
        listRef={listRef}
        title="favorites"
        emptyMessage={emptyMessage}
        tagListType={TagListType.Favorites}
      />
      <FABDown
        icon={fabOpen ? "minus" : "plus"}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({open}) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        theme={useTheme()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  labelHolder: {
    flexShrink: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  labelButton: {
    borderRadius: 0,
  },
})
