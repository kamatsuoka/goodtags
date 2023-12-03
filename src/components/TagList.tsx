import {setTagListType, setTagState, TagState} from "@app/modules/visitSlice"
import {StackParamList} from "@app/navigation/navigationParams"
import {useFocusEffect, useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {FlashList} from "@shopify/flash-list"
import {RefObject, useCallback, useRef} from "react"
import {Platform, StyleSheet, TouchableOpacity, View} from "react-native"
import {Text} from "react-native-paper"
import CommonStyles from "../constants/CommonStyles"
import {useAppDispatch, useAppSelector} from "../hooks"
import Tag from "../lib/models/Tag"
import {LoadingState, TagListType} from "../modules/tagLists"
import {getSelectedTagSetter, getTagListSelector} from "../modules/tagListUtil"
import TagListItem, {ITEM_HEIGHT} from "./TagListItem"

export type TagListProps = {
  title: string
  emptyMessage: string
  loadMore?: (numTags: number) => Promise<boolean>
  tagListType: TagListType
  listRef: RefObject<FlashList<number>>
}

/**
 * List of tags
 */
const TagList = (props: TagListProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const visibleIndex = useRef({
    max: 0,
    min: 0,
  })
  const dispatch = useAppDispatch()
  const allTagIds = useAppSelector(
    state => getTagListSelector(props.tagListType)(state).allTagIds,
  )
  const tagsById = useAppSelector(
    state => getTagListSelector(props.tagListType)(state).tagsById,
  )
  const selectedTag = useAppSelector(
    state => getTagListSelector(props.tagListType)(state).selectedTag,
  )
  const loadingState = useAppSelector(
    state => getTagListSelector(props.tagListType)(state).loadingState,
  )
  const setSelectedTag = getSelectedTagSetter(props.tagListType)
  const autoRotate = useAppSelector(state => state.options.autoRotate)
  const tagState = useAppSelector(state => state.visit.tagState)

  const {listRef} = props

  const scrollToSelectedTag = useCallback(() => {
    // scroll to selected index when user pages through list inside sheet music view
    if (selectedTag) {
      const i = selectedTag.index
      const numTags = allTagIds?.length
      if (
        listRef.current &&
        i < numTags &&
        i >= 0 &&
        allTagIds[i] === selectedTag.id
      ) {
        if (i < visibleIndex.current.min) {
          listRef.current.scrollToIndex({
            index: i,
            viewOffset: ITEM_HEIGHT / 2,
            viewPosition: 0,
          })
        } else if (i > visibleIndex.current.max) {
          listRef.current.scrollToIndex({
            index: i,
            viewOffset: -ITEM_HEIGHT / 2,
            viewPosition: 1,
          })
        }
      }
    }
  }, [selectedTag, allTagIds, listRef])

  // if came from tag screen, scroll to selected index.
  // useful for bringing last viewed tag's list item onto screen
  // after user has navigated using up/down arrows on tag screen
  useFocusEffect(
    useCallback(() => {
      if (tagState === TagState.closing) {
        dispatch(setTagState(undefined))
        scrollToSelectedTag()
      }
    }, [dispatch, scrollToSelectedTag, tagState]),
  )

  const onViewableItemsChanged = (items: {viewableItems: Array<any>}) => {
    if (items.viewableItems?.length > 0) {
      visibleIndex.current = {
        min: items.viewableItems[0].index,
        max: items.viewableItems[items.viewableItems.length - 1].index,
      }
    }
  }
  const viewabilityConfig = {
    waitForInteraction: true,
    viewAreaCoveragePercentThreshold: 95,
  }
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig,
      onViewableItemsChanged,
    },
  ])

  const listEmptyComponent = () => {
    if (props.emptyMessage) {
      return <Text style={styles.emptyMessage}>{props.emptyMessage}</Text>
    } else {
      return null
    }
  }

  /**
   * When user scrolls to bottom of results, load more
   */
  const onEndReached = async () => {
    if (props.loadMore && loadingState === LoadingState.succeeded) {
      const lastIndex = allTagIds.length - 1
      if (listRef.current && (await props.loadMore(allTagIds.length))) {
        // scroll up if more were loaded
        setTimeout(() => {
          // use timer because new tags aren't immediately available
          listRef.current!.scrollToIndex({
            index: lastIndex,
            viewOffset: -ITEM_HEIGHT,
            viewPosition: 1,
          })
          // listRef.current!.
        }, 200)
      }
    }
  }

  /**
   * Renders a single tag in the FlatList
   */
  const renderItem = useCallback(
    (tagData: {item: number; index: number}) => {
      const tag: Tag = tagsById[tagData.item]
      return (
        <TouchableOpacity
          style={styles.listItemHolder}
          onPress={() => {
            dispatch(setSelectedTag({index: tagData.index, id: tag.id}))
            dispatch(setTagListType(props.tagListType))
            dispatch(setTagState(TagState.opening))
            if (autoRotate && Platform.OS === "ios") {
              navigation.navigate("PortraitTransition")
            } else {
              navigation.navigate("Tag")
            }
          }}>
          <TagListItem
            tag={tag}
            tagListType={props.tagListType}
            index={tagData.index}
            selected={
              tagData.index === selectedTag?.index &&
              tag.id === selectedTag.id &&
              props.tagListType !== TagListType.History
            }
          />
        </TouchableOpacity>
      )
    },
    [
      autoRotate,
      dispatch,
      navigation,
      props.tagListType,
      selectedTag,
      setSelectedTag,
      tagsById,
    ],
  )

  return (
    <View style={CommonStyles.container}>
      <FlashList
        ref={listRef}
        data={allTagIds}
        estimatedItemSize={ITEM_HEIGHT}
        extraData={selectedTag}
        keyExtractor={(item, index) => "key" + index}
        ListEmptyComponent={listEmptyComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        renderItem={renderItem}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  statusView: {
    opacity: 1.0,
    flexDirection: "row",
    justifyContent: "center",
    height: 25,
  },
  emptyMessage: {
    fontSize: 14,
    paddingTop: 15,
    textAlign: "center",
  },
  listItemHolder: {
    flexDirection: "row",
  },
})

export default TagList
