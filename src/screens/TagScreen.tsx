/**
 * Screen for displaying tag sheet music
 */
import useSelectedTag from '@app/hooks/useSelectedTag'
import useTagListState from '@app/hooks/useTagListState'
import { TagState, setTagState } from '@app/modules/visitSlice'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { TagLayout } from '../components/TagLayout'
import { useAppDispatch, useAppSelector } from '../hooks'
import { FavoritesActions } from '../modules/favoritesSlice'
import { getSelectedTagSetter, isLabelType } from '../modules/tagListUtil'
import { TagListEnum } from '../modules/tagLists'
import { RootStackParamList } from '../navigation/navigationParams'

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

  function indexValid(index: number) {
    return index >= 0 && index < allTagIds.length
  }

  function getMaxIndex(): number {
    if (selectedTag !== undefined && indexValid(selectedTag.index)) {
      return allTagIds.length - 1
    }
    // may happen when last favorite is removed
    return 0 // sus
  }

  const hasPrevTag = () => selectedTag && selectedTag.index > 0
  const hasNextTag = () => selectedTag && selectedTag.index < getMaxIndex()

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

  const navigationActions = [
    {
      icon: 'arrow-up',
      onPress: async () => {
        selectPrevTag()
      },
      disabled: () => !hasPrevTag(),
    },
    {
      icon: 'arrow-down',
      onPress: async () => {
        selectNextTag()
      },
      disabled: () => !hasNextTag(),
    },
  ]

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
