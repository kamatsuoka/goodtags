import {clearLastVisited} from "@app/modules/visitSlice"
import {useFocusEffect} from "@react-navigation/native"
import {FlashList} from "@shopify/flash-list"
import {useCallback, useEffect, useRef, useState} from "react"
import {StyleSheet, View} from "react-native"
import {ActivityIndicator, Snackbar, useTheme} from "react-native-paper"
import {FABDown} from "../components/FABDown"
import ListHeader from "../components/ListHeader"
import TagList from "../components/TagList"
import CommonStyles from "../constants/CommonStyles"
import {SortOrder} from "../constants/Search"
import {
  AppDispatch,
  useAppDispatch,
  useAppSelector,
  useBodyInsets,
} from "../hooks"
import useFabDownStyle from "../hooks/useFabDownStyle"
import {NewActions, getNewTags, selectNew} from "../modules/newSlice"
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from "../modules/tagLists"

/**
 * New tags
 */
const NewScreen = () => {
  const {paddingLeft, paddingRight} = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch: AppDispatch = useAppDispatch()
  const loadingState = useAppSelector(state => selectNew(state).loadingState)
  const error = useAppSelector(state => selectNew(state).error)
  const sortOrder = useAppSelector(state => selectNew(state).sortOrder)
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
    dispatch(getNewTags(false))
  }, [dispatch])

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: SORT_LABELS[otherOrder],
      onPress: async () => {
        return dispatch(NewActions.toggleSortOrder())
      },
    },
    {
      icon: "reload",
      label: "reload new tags",
      onPress: async () => {
        return dispatch(getNewTags(true))
      },
    },
    {
      icon: "broom",
      label: "clear new tags",
      onPress: async () => {
        return dispatch(NewActions.reset())
      },
    },
  ]

  const setIdle = () => dispatch(NewActions.setLoadingState(LoadingState.idle))

  const themedStyles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        showBackButton={true}
        title="new tags"
        titleIcon="leaf"
      />
      <View style={themedStyles.listContainer}>
        <TagList
          tagListType={TagListEnum.New}
          emptyMessage={
            loadingState === LoadingState.succeeded ? "no tags found" : ""
          }
          listRef={listRef}
          title="New Tags"
        />
      </View>
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

export default NewScreen
