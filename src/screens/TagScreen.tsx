/**
 * Screen for displaying tag sheet music
 */
import useSelectedTag from '@app/hooks/useSelectedTag'
import useTagListState from '@app/hooks/useTagListState'
import { TagState, setTagState } from '@app/modules/visitSlice'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ColorValue,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { isTablet } from 'react-native-device-info'
import { Appbar, IconButton, Modal, Text, useTheme } from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
// import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { FABDown } from '../components/FABDown'
import NoteButton from '../components/NoteButton'
import SheetMusic from '../components/SheetMusic'
import TagInfoView from '../components/TagInfoView'
import TrackMenu from '../components/TrackMenu'
import VideoView from '../components/VideoView'
import CommonStyles from '../constants/CommonStyles'
import { useAppDispatch, useAppSelector } from '../hooks'
import { NoteHandler } from '../lib/NoteHandler'
import { noteForKey } from '../lib/NotePlayer'
import { IdBackground, InversePrimaryLowAlpha } from '../lib/theme'
import { FavoritesActions } from '../modules/favoritesSlice'
import { HistoryActions } from '../modules/historySlice'
import { getSelectedTagSetter, isLabelType } from '../modules/tagListUtil'
import { TagListEnum } from '../modules/tagLists'
import {
  PlayingState,
  playTrack,
  setTagTracks,
  stopTrack,
} from '../modules/tracksSlice'
import { RootStackParamList } from '../navigation/navigationParams'

type Props = NativeStackScreenProps<RootStackParamList, 'Tag'>

/**
 * Sheet music screen
 */
const TagScreen = ({ navigation }: Props) => {
  const theme = useTheme()
  const [buttonsDimmed, setButtonsDimmed] = useState(false)
  const [tracksVisible, setTracksVisible] = useState(false)
  const [videosVisible, setVideosVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const favoritesById = useAppSelector(state => state.favorites.tagsById)
  const tagListType = useAppSelector(state => state.visit.tagListType)
  const tagListState = useTagListState(tagListType)
  const allTagIds = tagListState.allTagIds
  const selectedTag = tagListState.selectedTag
  const playingState = useAppSelector(state => state.tracks.playingState)
  const tag = useSelectedTag(tagListType)
  const keyNote = noteForKey(tag.key)
  const noteHandler = useMemo(() => new NoteHandler(keyNote), [keyNote])
  const tracksState = useAppSelector(state => state.tracks)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const delabeledSelectedTag = useAppSelector(
    state => state.favorites.strandedTag,
  )

  const setSelectedTag = getSelectedTagSetter(tagListType)

  const ios = Platform.OS === 'ios'
  const iPad = ios && isTablet()

  const themedStyles = StyleSheet.create({
    id: {
      color: theme.colors.primary,
      fontSize: 18,
      marginRight: 7,
    },
    idHolder: {
      alignItems: 'baseline',
      backgroundColor: IdBackground,
      borderRadius: 7,
      borderColor: theme.colors.secondaryContainer,
      borderWidth: 2,
      flexDirection: 'row',
      paddingHorizontal: 7,
      paddingBottom: 4,
      paddingVertical: ios ? 4 : 0,
    },
    modal: {
      ...CommonStyles.modal,
      borderWidth: 1,
      backgroundColor: theme.colors.backdrop,
    },
    videoModal: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backdrop,
    },
    iconHolderDim: {
      backgroundColor: theme.colors.inverseOnSurface,
      opacity: BUTTON_DIM_OPACITY,
    },
    iconHolderBright: {
      backgroundColor: theme.colors.inverseOnSurface,
      opacity: 1.0,
    },
  })

  const topBarStyle = {
    ...styles.topBar,
    paddingTop: insets.top,
    // avoid split screen controls interfering with favorite button on iPad
    ...(iPad ? { left: 120 } : { left: 0, right: 0 }),
  }

  const fabGroupStyle = { ...styles.fabGroup, marginTop: 0, marginRight: 0 }
  const backButtonStyle = { ...styles.backButton, marginTop: 0, marginLeft: 0 }
  const bottomActionBarStyle = {
    ...styles.actionBar,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  }
  const modalCloseButtonStyle = { ...styles.closeButton }
  if (!ios) {
    fabGroupStyle.marginTop = insets.top - fabGroupStyle.paddingTop
    fabGroupStyle.marginRight = insets.right - fabGroupStyle.paddingRight
    backButtonStyle.marginTop = insets.top + 15
    backButtonStyle.marginLeft = insets.left
    bottomActionBarStyle.marginBottom = insets.bottom
    bottomActionBarStyle.marginLeft = insets.left
    bottomActionBarStyle.marginRight = insets.right
    modalCloseButtonStyle.top += insets.top
    modalCloseButtonStyle.left += insets.left
  }

  const videoModalStyle = StyleSheet.compose(
    themedStyles.modal,
    themedStyles.videoModal,
  )

  const dimmerTimerRef = useRef(0)

  const BUTTON_DIM_TIME = 4000

  const brightenButtons = useCallback(() => {
    clearTimeout(dimmerTimerRef.current)
    setButtonsDimmed(false)
  }, [])

  const dimButtons = useCallback(() => {
    clearTimeout(dimmerTimerRef.current)
    setButtonsDimmed(true)
  }, [])

  const brightenThenFade = useCallback(() => {
    brightenButtons()
    // @ts-ignore
    dimmerTimerRef.current = setTimeout(() => {
      setButtonsDimmed(true)
    }, BUTTON_DIM_TIME)
  }, [brightenButtons])

  useEffect(() => {
    brightenThenFade()
    return () => clearTimeout(dimmerTimerRef.current)
  }, [brightenThenFade])

  const HISTORY_MIN_VIEW_TIME = 7000
  useEffect(() => {
    // after viewing tag for a while, add it to history
    const timeoutId = setTimeout(() => {
      dispatch(HistoryActions.addHistory({ tag }))
    }, HISTORY_MIN_VIEW_TIME)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [dispatch, tag])

  // set track data into store
  useEffect(() => {
    dispatch(setTagTracks(tag))
  }, [dispatch, tag])

  useEffect(() => {
    // Clean up when component unmounts
    return () => {
      // When the component unmounts, stop the track
      dispatch(stopTrack())
    }
  }, [dispatch, selectedTag])

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

  const hasTracks = (): boolean => {
    const tracks = tag.tracks
    return tracks?.length > 0 && tracks[0] !== undefined
  }
  const hasVideos = (): boolean => {
    const videos = tag.videos
    return videos?.length > 0 && videos[0] !== undefined
  }
  const hasPrevTag = () => selectedTag && selectedTag.index > 0
  const hasNextTag = () => selectedTag && selectedTag.index < getMaxIndex()

  const fabActions = [
    {
      icon: 'file-document-outline',
      label: 'tag info',
      onPress: () => setInfoVisible(true),
    },
    {
      icon: 'tag-outline',
      label: 'labels',
      onPress: () => navigation.navigate('TagLabels'),
    },
  ]
  if (hasTracks()) {
    fabActions.push({
      icon: 'headphones',
      label: 'tracks',
      onPress: () => setTracksVisible(true),
    })
  }
  if (hasVideos()) {
    fabActions.push({
      icon: 'video-box',
      label: 'videos',
      onPress: () => setVideosVisible(true),
    })
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

  const playOrPause = () => {
    if (tracksState.selectedTrack) {
      if (playingState === PlayingState.playing) {
        dispatch(stopTrack())
      } else {
        dispatch(playTrack(false))
      }
    }
  }

  const noteIcon = useCallback(
    (props: { size: number; color: ColorValue }) => (
      <NoteButton note={keyNote} {...props} />
    ),
    [keyNote],
  )
  const memoizedSheetMusic = useMemo(
    () => <SheetMusic uri={tag.uri} onPress={brightenThenFade} />,
    [brightenThenFade, tag.uri],
  )

  const SMALL_BUTTON_SIZE = 26
  const BIG_BUTTON_SIZE = 40

  const dimmableIconHolderStyle = buttonsDimmed
    ? themedStyles.iconHolderDim
    : themedStyles.iconHolderBright

  type AppActionProps = {
    icon: string | IconSource
    onPress: () => void
    disabled?: boolean
    onPressIn?: () => void
    onPressOut?: () => void
  }

  const AppAction = useCallback(
    (props: AppActionProps) => {
      return (
        <Appbar.Action
          icon={props.icon}
          color={theme.colors.primary}
          onPress={() => {
            brightenThenFade()
            props.onPress()
          }}
          onPressIn={props.onPressIn}
          onPressOut={props.onPressOut}
          disabled={props.disabled}
          size={BIG_BUTTON_SIZE}
          style={dimmableIconHolderStyle}
        />
      )
    },
    [brightenThenFade, dimmableIconHolderStyle, theme.colors.primary],
  )

  // need to zero out insets to make modal cover whole screen in ios
  return (
    <View style={CommonStyles.container}>
      {memoizedSheetMusic}
      <View style={topBarStyle} pointerEvents="box-none">
        {/* using TouchableOpacity instead of button to make sure
                visual feedback matches shape of button */}
        <TouchableOpacity
          onPress={() => toggleFavorite(tag.id)}
          activeOpacity={0.4}
        >
          <View style={themedStyles.idHolder}>
            <Text style={themedStyles.id}># {tag.id}</Text>
            <Icon
              name={favoritesById[tag.id] ? 'heart' : 'heart-outline'}
              color={theme.colors.primary}
              size={16}
            />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonHolder} pointerEvents="box-none">
        <View style={styles.actionBar} pointerEvents="box-none">
          <Appbar.BackAction
            color={theme.colors.primary}
            onPress={goBack}
            size={SMALL_BUTTON_SIZE}
            style={backButtonStyle}
          />
        </View>
        {buttonsDimmed ? null : (
          <View
            style={bottomActionBarStyle}
            pointerEvents="box-none"
            // entering={FadeIn.duration(100)}
            // exiting={FadeOut.duration(1200)}
          >
            {/* not using AppAction here b/c onPressOut got lost */}
            <Appbar.Action
              icon={noteIcon}
              onPress={() => {
                // handler required for onPressIn to be handled
              }}
              onPressIn={async () => {
                noteHandler.onPressIn()
                brightenButtons()
              }}
              onPressOut={async () => {
                noteHandler.onPressOut()
                brightenThenFade()
              }}
              color={theme.colors.primary}
              size={BIG_BUTTON_SIZE}
              style={dimmableIconHolderStyle}
            />
            <AppAction
              icon={playingState === PlayingState.playing ? 'pause' : 'play'}
              onPress={async () => {
                dispatch(playOrPause)
              }}
              disabled={!hasTracks()}
            />
            <Appbar.Content title=" " pointerEvents="none" />
            <AppAction
              icon="arrow-up"
              onPress={async () => {
                selectPrevTag()
              }}
              disabled={!hasPrevTag()}
            />
            <AppAction
              icon="arrow-down"
              onPress={async () => {
                selectNextTag()
              }}
              disabled={!hasNextTag()}
            />
          </View>
        )}
        <FABDown
          icon={fabOpen ? 'minus' : 'cog-outline'}
          open={fabOpen}
          actions={fabActions}
          onStateChange={({ open }) => {
            dimButtons()
            setFabOpen(open)
          }}
          style={fabGroupStyle}
          fabStyle={styles.fabDown}
          theme={theme}
        />
      </View>
      <SafeAreaInsetsContext.Provider
        value={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Modal
          visible={infoVisible}
          onDismiss={() => setInfoVisible(false)}
          style={themedStyles.modal}
        >
          <TagInfoView tag={tag} tagListType={tagListType} />
        </Modal>
        {hasVideos() ? (
          <Modal
            visible={videosVisible}
            onDismiss={() => setVideosVisible(false)}
            style={videoModalStyle}
          >
            <VideoView tag={tag} />
          </Modal>
        ) : null}
        <Modal
          visible={tracksVisible}
          onDismiss={() => setTracksVisible(false)}
          style={themedStyles.modal}
        >
          <TrackMenu onDismiss={() => setTracksVisible(false)} />
        </Modal>
        {videosVisible ? (
          <IconButton
            icon="close"
            mode="contained"
            onPress={() => setVideosVisible(false)}
            style={modalCloseButtonStyle}
          />
        ) : null}
      </SafeAreaInsetsContext.Provider>
    </View>
  )
}

const BUTTON_DIM_OPACITY = 0.5

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 3,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  actionBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 80,
  },
  fabDown: {
    ...CommonStyles.fabDown,
    marginBottom: 20,
  },
  fabGroup: {
    paddingTop: 21,
    paddingRight: 16,
  },
  noteIcon: {
    position: 'absolute',
    margin: 20,
    left: 0,
    bottom: 56,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    left: 10,
  },
  backButton: {
    backgroundColor: IdBackground,
  },
  iconHolder: {
    backgroundColor: InversePrimaryLowAlpha,
  },
})

export default TagScreen
