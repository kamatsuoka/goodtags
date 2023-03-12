import React, {useCallback, useRef, useState} from "react"
import CommonStyles from "../constants/CommonStyles"
import TagList from "../components/TagList"
import {useAppDispatch, useAppSelector} from "../hooks"
import {HistoryActions} from "../modules/historySlice"
import {SORT_ICONS, SORT_LABELS, TagListType} from "../modules/tagLists"
import {useFocusEffect} from "@react-navigation/native"
import {View} from "react-native"
import {SortOrder} from "../constants/Search"
import {ImpactFeedbackStyle} from "expo-haptics"
import {FlashList} from "@shopify/flash-list"
import useFabDownStyle from "../hooks/useFabDownStyle"
import ListHeader from "../components/ListHeader"
import {FABDown} from "../components/FABDown"
import useHaptics from "@app/hooks/useHaptics"

/**
 * Recently viewed tags.
 */
const HistoryScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.history.sortOrder)
  const lastModified = useAppSelector(state => state.history.lastModified)
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

  useFocusEffect(
    useCallback(() => {
      dispatch(HistoryActions.incorporateHistory())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, lastModified]),
  )

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: SORT_LABELS[otherOrder],
      onPress: async () => {
        await haptics.selectionAsync()
        dispatch(HistoryActions.toggleSortOrder())
      },
    },
    {
      icon: "broom",
      label: "clear history",
      onPress: async () => {
        await haptics.impactAsync(ImpactFeedbackStyle.Medium)
        dispatch(HistoryActions.clearHistory())
      },
    },
  ]

  return (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} />
      <TagList
        listRef={listRef}
        title="History"
        emptyMessage="Tags you have viewed will show up here"
        tagListType={TagListType.History}
      />
      <FABDown
        icon={fabOpen ? "minus" : "plus"}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({open}) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
      />
    </View>
  )
}

export default HistoryScreen
