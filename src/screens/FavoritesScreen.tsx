import useHaptics from "@app/hooks/useHaptics"
import {useFocusEffect} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {useCallback, useRef, useState} from "react"
import {View} from "react-native"
import {useTheme} from "react-native-paper"
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
 * Favorites list
 */
export const FavoritesScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.favorites.sortOrder)
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

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const iconLabel =
    sortOrder === SortOrder.newest
      ? "sort alphabetically"
      : "sort by recently added"

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        await haptics.selectionAsync()
        dispatch(FavoritesActions.toggleSortOrder())
      },
    },
  ]

  const emptyMessage = "tap the heart icon in sheet music to add favorites"
  return (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} title="faves" titleIcon="heart-outline" />
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
