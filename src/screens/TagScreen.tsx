/**
 * Screen for displaying tag sheet music
 */
import { TagLayout } from '@app/components/TagLayout'
import {
  useAppDispatch,
  useAppSelector,
  useSelectedTag,
  useTagListState,
} from '@app/hooks'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { refreshTag } from '@app/modules/refreshTagThunk'
import { getSelectedTagSetter } from '@app/modules/tagListUtil'
import { TagListEnum, isLabelType } from '@app/modules/tagLists'
import { TagState, setTagState } from '@app/modules/visitSlice'
import { RootStackParamList } from '@app/navigation/navigationParams'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo } from 'react'

type Props = NativeStackScreenProps<RootStackParamList, 'Tag'>

/**
 * Sheet music screen
 */
const TagScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const favoritesById = useAppSelector(state => state.favorites.tagsById)
  const tagListType = useAppSelector(state => state.visit.tagListType)
  const tagListState = useTagListState(tagListType)
  const allTagIds = tagListState.allTagIds
  const selectedTag = tagListState.selectedTag
  const tag = useSelectedTag(tagListType)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const delabeledSelectedTag = useAppSelector(
    state => state.favorites.strandedTag,
  )

  const setSelectedTag = getSelectedTagSetter(tagListType)

  // Refresh tag data when opening to ensure we have latest metadata
  useEffect(() => {
    if (tag?.id) {
      console.log('[TagScreen] Refreshing tag metadata for tag:', tag.id)
      dispatch(refreshTag({ id: tag.id, tagListType }))
    }
  }, [dispatch, tag?.id, tagListType])

  /**
   * Go back to list.
   * Set TagState to closing so that when we return list,
   * we can scroll to the selected tag.
   */
  function goBack() {
    if (
      isLabelType(tagListType) &&
      delabeledSelectedTag?.label === selectedLabel &&
      delabeledSelectedTag?.tag.id === selectedTag?.id
    ) {
      dispatch(FavoritesActions.removeStrandedTag())
    }
    dispatch(setTagState(TagState.closing))
    navigation.goBack()
  }

  function selectPrevTag() {
    // causes previous tag in list to be displayed
    if (selectedTag) {
      const i = selectedTag.index
      if (i > 0) {
        selectTag(i - 1)
      }
    }
  }

  function selectNextTag() {
    // causes next tag in list to be displayed
    if (selectedTag) {
      const i = selectedTag.index
      if (i < allTagIds.length - 1) {
        selectTag(i + 1)
      }
    }
  }

  function selectTag(index: number) {
    const id = allTagIds[index]
    dispatch(setSelectedTag({ index, id }))
  }

  async function toggleFavorite(id: number) {
    if (favoritesById[id]) {
      dispatch(FavoritesActions.removeFavorite(id))
      if (tagListType === TagListEnum.Favorites) {
        goBack() // go back to favorites list
      }
    } else {
      dispatch(FavoritesActions.addFavorite(tag))
    }
  }

  const navigationActions = useMemo(
    () => [
      {
        icon: 'arrow-up',
        onPress: () => selectPrevTag(),
        disabled: () => !selectedTag || selectedTag.index <= 0,
      },
      {
        icon: 'arrow-down',
        onPress: () => selectNextTag(),
        disabled: () =>
          !selectedTag || selectedTag.index >= allTagIds.length - 1,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTag, allTagIds.length],
  )

  return (
    <TagLayout
      tag={tag}
      tagListType={tagListType as TagListEnum}
      favoritesById={favoritesById}
      onToggleFavorite={toggleFavorite}
      onBack={goBack}
      navigationActions={navigationActions}
    />
  )
}

export default TagScreen
