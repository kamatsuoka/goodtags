/**
 * Screen for displaying tag sheet music
 */
import useSelectedTag from '@app/hooks/useSelectedTag'
import useTagListState from '@app/hooks/useTagListState'
import { TagState, setTagState } from '@app/modules/visitSlice'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Appbar, useTheme } from 'react-native-paper'
import { TagLayout } from '../components/TagLayout'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useButtonDimming } from '../hooks/useButtonDimming'
import { useTagEffects } from '../hooks/useTagEffects'
import useTagMedia from '../hooks/useTagMedia'
import { useTagScreenStyles } from '../hooks/useTagScreenStyles'
import useTagTrackPlayer from '../hooks/useTagTrackPlayer'
import { FavoritesActions } from '../modules/favoritesSlice'
import { getSelectedTagSetter, isLabelType } from '../modules/tagListUtil'
import { TagListEnum } from '../modules/tagLists'
import { RootStackParamList } from '../navigation/navigationParams'

type Props = NativeStackScreenProps<RootStackParamList, 'Tag'>

const BIG_BUTTON_SIZE = 40

/**
 * Sheet music screen
 */
const TagScreen = ({ navigation }: Props) => {
  const theme = useTheme()
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

  const { buttonsDimmed, brightenButtons, dimButtons, brightenThenFade } =
    useButtonDimming()

  const styles = useTagScreenStyles(buttonsDimmed)

  const [tracksVisible, setTracksVisible] = React.useState(false)
  const [videosVisible, setVideosVisible] = React.useState(false)
  const [infoVisible, setInfoVisible] = React.useState(false)
  const [fabOpen, setFabOpen] = React.useState(false)

  const setSelectedTag = getSelectedTagSetter(tagListType)
  const { audioPlaying, setTrackUrl: setUrl, playOrPause } = useTagTrackPlayer()
  const { hasTracks, hasVideos } = useTagMedia(tag)
  useTagEffects(tag)

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

  const navigationActions = (
    <>
      <Appbar.Content title=" " pointerEvents="none" />
      <Appbar.Action
        icon="arrow-up"
        onPress={async () => {
          brightenThenFade()
          selectPrevTag()
        }}
        disabled={!hasPrevTag()}
        color={theme.colors.primary}
        size={BIG_BUTTON_SIZE}
        style={styles.dimmableIconHolderStyle}
      />
      <Appbar.Action
        icon="arrow-down"
        onPress={async () => {
          brightenThenFade()
          selectNextTag()
        }}
        disabled={!hasNextTag()}
        color={theme.colors.primary}
        size={BIG_BUTTON_SIZE}
        style={styles.dimmableIconHolderStyle}
      />
    </>
  )

  return (
    <TagLayout
      tag={tag}
      tagListType={tagListType as TagListEnum}
      favoritesById={favoritesById}
      audioPlaying={audioPlaying}
      buttonsDimmed={buttonsDimmed}
      tracksVisible={tracksVisible}
      videosVisible={videosVisible}
      infoVisible={infoVisible}
      fabOpen={fabOpen}
      hasTracks={hasTracks}
      hasVideos={hasVideos}
      onToggleFavorite={toggleFavorite}
      onPlayOrPause={playOrPause}
      onBack={goBack}
      onBrightenButtons={brightenButtons}
      onBrightenThenFade={brightenThenFade}
      onDimButtons={dimButtons}
      onSetTracksVisible={setTracksVisible}
      onSetVideosVisible={setVideosVisible}
      onSetInfoVisible={setInfoVisible}
      onSetFabOpen={setFabOpen}
      onNavigateToTagLabels={() => navigation.navigate('TagLabels')}
      onPlayTrack={setUrl}
      styles={styles}
      additionalActions={navigationActions}
      dimAdditionalActions={true}
    />
  )
}

export default TagScreen
