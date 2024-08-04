import useHaptics from "@app/hooks/useHaptics"
import {clearLastVisited} from "@app/modules/visitSlice"
import {useFocusEffect} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {ImpactFeedbackStyle} from "expo-haptics"
import {useCallback, useEffect, useRef, useState} from "react"
import {View} from "react-native"
import {ActivityIndicator, Snackbar, useTheme} from "react-native-paper"
import {FABDown} from "../components/FABDown"
import ListHeader from "../components/ListHeader"
import TagList from "../components/TagList"
import CommonStyles from "../constants/CommonStyles"
import {SortOrder} from "../constants/Search"
import {AppDispatch, useAppDispatch, useAppSelector} from "../hooks"
import useFabDownStyle from "../hooks/useFabDownStyle"
import {
  ClassicActions,
  getClassicTags,
  selectClassic,
} from "../modules/classicSlice"
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from "../modules/tagLists"

/**
 * Classic tags
 */
const ClassicScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch: AppDispatch = useAppDispatch()
  const loadingState = useAppSelector(
    state => selectClassic(state).loadingState,
  )
  const error = useAppSelector(state => selectClassic(state).error)
  const sortOrder = useAppSelector(state => selectClassic(state).sortOrder)
  const listRef = useRef<FlashList<number>>(null)
  const fabStyleSheet = useFabDownStyle()

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  useEffect(() => {
    dispatch(getClassicTags(false))
  }, [dispatch])

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.downloads : SortOrder.alpha

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: SORT_LABELS[otherOrder],
      onPress: async () => {
        await haptics.selectionAsync()
        return dispatch(ClassicActions.toggleSortOrder())
      },
    },
    {
      icon: "reload",
      label: "reload classic tags",
      onPress: async () => {
        await haptics.impactAsync(ImpactFeedbackStyle.Medium)
        return dispatch(getClassicTags(true))
      },
    },
    {
      icon: "broom",
      label: "clear classic tags",
      onPress: async () => {
        await haptics.impactAsync(ImpactFeedbackStyle.Medium)
        return dispatch(ClassicActions.reset())
      },
    },
  ]

  const setIdle = () =>
    dispatch(ClassicActions.setLoadingState(LoadingState.idle))

  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        showBackButton={true}
        title="classic tags"
        titleIcon="star"
      />
      <TagList
        tagListType={TagListEnum.Classic}
        emptyMessage={
          loadingState === LoadingState.succeeded ? "no tags found" : ""
        }
        listRef={listRef}
        title="Classic Tags"
      />
      {loadingState === LoadingState.pending ? (
        <View style={CommonStyles.spinnerHolder}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}
      <Snackbar
        visible={loadingState === LoadingState.failed}
        onDismiss={setIdle}
        onIconPress={setIdle}>
        {`error fetching tags: ${error}`}
      </Snackbar>
      <FABDown
        icon={fabOpen ? "minus" : "cog-outline"}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({open}) => setFabOpen(open)}
        onLongPress={() => dispatch(clearLastVisited())}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        theme={useTheme()}
      />
    </View>
  )
}

export default ClassicScreen
