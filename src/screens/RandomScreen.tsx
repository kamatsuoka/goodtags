/**
 * Screen for displaying a random tag
 */
import { SearchResult } from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo } from 'react'
import { TagLayout } from '../components/TagLayout'
import { useAppDispatch, useAppSelector } from '../hooks'
import { FavoritesActions } from '../modules/favoritesSlice'
import { getRandomTag, selectRandomTag } from '../modules/randomSlice'

// Fallback tag to avoid recreating on every render
const FALLBACK_TAG: SearchResult = {
  id: 0,
  title: 'not found',
  key: 'F:natural',
} as SearchResult

/**
 * Random tag screen
 */
const RandomScreen = () => {
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const favoritesById = useAppSelector(state => state.favorites.tagsById)
  const tag = useAppSelector(state => {
    return selectRandomTag(state) || FALLBACK_TAG
  })

  useEffect(() => {
    dispatch(getRandomTag())
  }, [dispatch])

  async function toggleFavorite(id: number) {
    if (favoritesById[id]) {
      dispatch(FavoritesActions.removeFavorite(id))
    } else {
      dispatch(FavoritesActions.addFavorite(tag))
    }
  }

  const handleShuffle = useCallback(() => {
    dispatch(getRandomTag())
  }, [dispatch])

  const navigationActions = useMemo(
    () => [
      {
        icon: 'shuffle',
        onPress: handleShuffle,
      },
    ],
    [handleShuffle],
  )

  return (
    <TagLayout
      tag={tag}
      tagListType={TagListEnum.SearchResults}
      favoritesById={favoritesById}
      onToggleFavorite={toggleFavorite}
      onBack={navigation.goBack}
      navigationActions={navigationActions}
    />
  )
}

export default RandomScreen
