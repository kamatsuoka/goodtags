import useHaptics from "@app/hooks/useHaptics"
import {useFocusEffect} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {useCallback, useRef, useState} from "react"
import {StyleSheet, View} from "react-native"
import {Text, useTheme} from "react-native-paper"
import {FABDown} from "../components/FABDown"
import ListHeader from "../components/ListHeader"
import TagList from "../components/TagList"
import CommonStyles from "../constants/CommonStyles"
import {SortOrder} from "../constants/Search"
import {useAppDispatch, useAppSelector} from "../hooks"
import useFabDownStyle from "../hooks/useFabDownStyle"
import {FavoritesActions} from "../modules/favoritesSlice"
import {SORT_ICONS, TagListType} from "../modules/tagLists"

/**
 * Favorites lists and lists of labeled tags.
 */
export const FavoritesScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.favorites.sortOrder)
  const labeledSortOrder = useAppSelector(
    state => state.favorites.labeledSortOrder,
  )
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
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

  const order = selectedLabel ? labeledSortOrder : sortOrder
  const otherOrder =
    order === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const iconLabel =
    order === SortOrder.newest
      ? "sort alphabetically"
      : selectedLabel
        ? "sort by id"
        : "sort by recently added"

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        await haptics.selectionAsync()
        dispatch(
          selectedLabel
            ? FavoritesActions.toggleLabeledSortOrder()
            : FavoritesActions.toggleSortOrder(),
        )
      },
    },
  ]

  const emptyMessage = selectedLabel
    ? "no tags with this label yet"
    : "tap the heart icon in sheet music to add favorites"
  return (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} title="faves" />
      {selectedLabel ? (
        <View style={styles.labelHolder}>
          <Text>{selectedLabel}</Text>
        </View>
      ) : null}
      <TagList
        listRef={listRef}
        title="favorites"
        emptyMessage={emptyMessage}
        tagListType={TagListType.Favorites}
      />
      <FABDown
        icon={fabOpen ? "minus" : "cog"}
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
