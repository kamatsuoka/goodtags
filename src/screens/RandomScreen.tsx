/**
 * Screen for displaying a random tag
 */
import { SearchResult } from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import { useNavigation } from '@react-navigation/native'
import React, { useEffect } from 'react'
import { Appbar, useTheme } from 'react-native-paper'
import { TagLayout } from '../components/TagLayout'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useTagScreenStyles } from '../hooks/useTagScreenStyles'
import useTagTrackPlayer from '../hooks/useTagTrackPlayer'
import { FavoritesActions } from '../modules/favoritesSlice'
import { getRandomTag, selectRandomTag } from '../modules/randomSlice'

// Fallback tag to avoid recreating on every render
const FALLBACK_TAG: SearchResult = {
  id: 0,
  title: 'not found',
  key: 'F:natural',
} as SearchResult

const BIG_BUTTON_SIZE = 40

/**
 * Random tag screen
 */
const RandomScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const favoritesById = useAppSelector(state => state.favorites.tagsById)
  const tag = useAppSelector(state => {
    return selectRandomTag(state) || FALLBACK_TAG
  })

  const styles = useTagScreenStyles(false, false)

  useEffect(() => {
    dispatch(getRandomTag())
  }, [dispatch])

  const { audioPlaying, setTrackUrl, playOrPause, pause } = useTagTrackPlayer()

  async function toggleFavorite(id: number) {
    if (favoritesById[id]) {
      dispatch(FavoritesActions.removeFavorite(id))
    } else {
      dispatch(FavoritesActions.addFavorite(tag))
    }
  }

  const shuffleAction = (
    <>
      <Appbar.Content title=" " pointerEvents="none" />
      <Appbar.Action
        icon="shuffle"
        onPress={async () => {
          try {
            pause()
          } catch (e) {
            // ignore if player not available
          }
          dispatch(getRandomTag())
        }}
        color={theme.colors.primary}
        size={BIG_BUTTON_SIZE}
        style={styles.dimmableIconHolderStyle}
      />
    </>
  )

  return (
    <TagLayout
      tag={tag}
      tagListType={TagListEnum.SearchResults}
      favoritesById={favoritesById}
      audioPlaying={audioPlaying}
      onToggleFavorite={toggleFavorite}
      onPlayOrPause={playOrPause}
      onBack={navigation.goBack}
      onPause={() => {
        pause()
      }}
      onPlayTrack={setTrackUrl}
      additionalActions={shuffleAction}
    />
  )
}

export default RandomScreen
