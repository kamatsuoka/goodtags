/**
 * Screen for displaying a random tag
 */
import { SearchResult } from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import { getSelectedTrack } from '@app/modules/tracksSlice'
import { useNavigation } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { Appbar, useTheme } from 'react-native-paper'
import { TagScreenLayout } from '../components/TagScreenLayout'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useButtonDimming } from '../hooks/useButtonDimming'
import { useTagEffects } from '../hooks/useTagEffects'
import { useTagScreenStyles } from '../hooks/useTagScreenStyles'
import useTrackPlayer from '../hooks/useTrackPlayer'
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
  const [tracksVisible, setTracksVisible] = useState(false)
  const [videosVisible, setVideosVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch = useAppDispatch()
  const favoritesById = useAppSelector(state => state.favorites.tagsById)
  const tag = useAppSelector(state => {
    return selectRandomTag(state) || FALLBACK_TAG
  })
  const tracksState = useAppSelector(state => state.tracks)
  const selectedTrack = getSelectedTrack(
    tracksState.tagTracks,
    tracksState.selectedPart,
  )
  const {
    player: trackPlayer,
    playing: audioPlaying,
    playOrPause: trackPlayOrPause,
    setTrackUrl,
  } = useTrackPlayer(selectedTrack?.url)

  const { buttonsDimmed, brightenButtons, dimButtons, brightenThenFade } =
    useButtonDimming()

  const styles = useTagScreenStyles(buttonsDimmed)

  useEffect(() => {
    dispatch(getRandomTag())
  }, [dispatch])

  useEffect(() => {
    if (tag.id !== 0) {
      console.log(`RandomScreen: tag id=${tag.id}`)
    }
  }, [tag.id])

  useTagEffects(tag)

  const hasTracks = (): boolean => {
    const tracks = tag.tracks
    return tracks?.length > 0 && tracks[0] !== undefined
  }
  const hasVideos = (): boolean => {
    const videos = tag.videos
    return videos?.length > 0 && videos[0] !== undefined
  }

  async function toggleFavorite(id: number) {
    if (favoritesById[id]) {
      dispatch(FavoritesActions.removeFavorite(id))
    } else {
      dispatch(FavoritesActions.addFavorite(tag))
    }
  }

  const playOrPause = () => {
    if (selectedTrack) {
      trackPlayOrPause()
    }
  }

  const shuffleAction = (
    <>
      <Appbar.Content title=" " pointerEvents="none" />
      <Appbar.Action
        icon="shuffle"
        onPress={async () => {
          brightenThenFade()
          try {
            trackPlayer?.pause?.()
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
    <TagScreenLayout
      tag={tag}
      tagListType={TagListEnum.SearchResults}
      favoritesById={favoritesById}
      audioPlaying={audioPlaying}
      buttonsDimmed={buttonsDimmed}
      tracksVisible={tracksVisible}
      videosVisible={videosVisible}
      infoVisible={infoVisible}
      fabOpen={fabOpen}
      hasTracks={hasTracks()}
      hasVideos={hasVideos()}
      onToggleFavorite={toggleFavorite}
      onPlayOrPause={playOrPause}
      onBack={navigation.goBack}
      onBrightenButtons={brightenButtons}
      onBrightenThenFade={brightenThenFade}
      onDimButtons={dimButtons}
      onSetTracksVisible={setTracksVisible}
      onSetVideosVisible={setVideosVisible}
      onSetInfoVisible={setInfoVisible}
      onSetFabOpen={setFabOpen}
      onNavigateToTagLabels={() => navigation.navigate('TagLabels')}
      onPlayTrack={setTrackUrl}
      styles={styles}
      additionalActions={shuffleAction}
    />
  )
}

export default RandomScreen
