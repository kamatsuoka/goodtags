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
import {SORT_ICONS} from "../modules/tagLists"

/**
 * Lists of labeled tags
 */
export const LabelScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const labeledSortOrder = useAppSelector(
    state => state.favorites.labeledSortOrder,
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

  const order = labeledSortOrder
  const otherOrder =
    order === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const iconLabel =
    order === SortOrder.newest ? "sort alphabetically" : "sort by id"

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        await haptics.selectionAsync()
        dispatch(FavoritesActions.toggleLabeledSortOrder())
      },
    },
  ]

  const emptyMessage = "no tags with this label yet"
  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        title={selectedLabel}
        showBackButton={true}
      />
      <TagList
        listRef={listRef}
        title="label"
        emptyMessage={emptyMessage}
        tagListType={selectedLabel || ""}
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