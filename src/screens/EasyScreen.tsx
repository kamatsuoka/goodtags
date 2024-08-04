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
import {EasyActions, getEasyTags, selectEasy} from "../modules/easySlice"
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from "../modules/tagLists"

/**
 * Easy tags
 */
const EasyScreen = () => {
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch: AppDispatch = useAppDispatch()
  const loadingState = useAppSelector(state => selectEasy(state).loadingState)
  const error = useAppSelector(state => selectEasy(state).error)
  const sortOrder = useAppSelector(state => selectEasy(state).sortOrder)
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
    dispatch(getEasyTags(false))
  }, [dispatch])

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.id : SortOrder.alpha

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: SORT_LABELS[otherOrder],
      onPress: async () => {
        await haptics.selectionAsync()
        return dispatch(EasyActions.toggleSortOrder())
      },
    },
    {
      icon: "reload",
      label: "reload easy tags",
      onPress: async () => {
        await haptics.impactAsync(ImpactFeedbackStyle.Medium)
        return dispatch(getEasyTags(true))
      },
    },
    {
      icon: "broom",
      label: "clear easy tags",
      onPress: async () => {
        await haptics.impactAsync(ImpactFeedbackStyle.Medium)
        return dispatch(EasyActions.reset())
      },
    },
  ]

  const setIdle = () => dispatch(EasyActions.setLoadingState(LoadingState.idle))

  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        showBackButton={true}
        title="easy tags"
        titleIcon="teddy-bear"
      />
      <TagList
        tagListType={TagListEnum.Easy}
        emptyMessage={
          loadingState === LoadingState.succeeded ? "no tags found" : ""
        }
        listRef={listRef}
        title="Easy Tags"
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

export default EasyScreen
