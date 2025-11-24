import Tag from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import { ReactNode, useCallback, useMemo } from 'react'
import { ColorValue, View } from 'react-native'
import { Appbar, IconButton, Modal, Text, useTheme } from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import CommonStyles from '../constants/CommonStyles'
import { NoteHandler } from '../lib/NoteHandler'
import { noteForKey } from '../lib/NotePlayer'
import { PlayingState } from '../modules/tracksSlice'
import { FABDown } from './FABDown'
import NoteButton from './NoteButton'
import SheetMusic from './SheetMusic'
import TagInfoView from './TagInfoView'
import TrackMenu from './TrackMenu'
import VideoView from './VideoView'

const SMALL_BUTTON_SIZE = 26
const BIG_BUTTON_SIZE = 40

type AppActionProps = {
  icon: string | IconSource
  onPress: () => void
  disabled?: boolean
  onPressIn?: () => void
  onPressOut?: () => void
}

interface TagScreenLayoutProps {
  tag: Tag
  tagListType: TagListEnum
  favoritesById: Record<number, any>
  playingState: PlayingState
  buttonsDimmed: boolean
  tracksVisible: boolean
  videosVisible: boolean
  infoVisible: boolean
  fabOpen: boolean
  hasTracks: boolean
  hasVideos: boolean
  onToggleFavorite: (id: number) => void
  onPlayOrPause: () => void
  onBack: () => void
  onBrightenButtons: () => void
  onBrightenThenFade: () => void
  onDimButtons: () => void
  onSetTracksVisible: (visible: boolean) => void
  onSetVideosVisible: (visible: boolean) => void
  onSetInfoVisible: (visible: boolean) => void
  onSetFabOpen: (open: boolean) => void
  onNavigateToTagLabels: () => void
  styles: any
  additionalActions?: ReactNode
  dimAdditionalActions?: boolean
}

export const TagScreenLayout = ({
  tag,
  tagListType,
  favoritesById,
  playingState,
  buttonsDimmed,
  tracksVisible,
  videosVisible,
  infoVisible,
  fabOpen,
  hasTracks,
  hasVideos,
  onToggleFavorite,
  onPlayOrPause,
  onBack,
  onBrightenButtons,
  onBrightenThenFade,
  onDimButtons,
  onSetTracksVisible,
  onSetVideosVisible,
  onSetInfoVisible,
  onSetFabOpen,
  onNavigateToTagLabels,
  styles,
  additionalActions,
  dimAdditionalActions = false,
}: TagScreenLayoutProps) => {
  const theme = useTheme()
  const keyNote = noteForKey(tag.key)
  const noteHandler = useMemo(() => new NoteHandler(keyNote), [keyNote])

  const fabActions = [
    {
      icon: 'file-document-outline',
      label: 'tag info',
      onPress: () => onSetInfoVisible(true),
    },
    {
      icon: 'tag-outline',
      label: 'labels',
      onPress: onNavigateToTagLabels,
    },
  ]

  if (hasTracks) {
    fabActions.push({
      icon: 'headphones',
      label: 'tracks',
      onPress: () => onSetTracksVisible(true),
    })
  }

  if (hasVideos) {
    fabActions.push({
      icon: 'video-box',
      label: 'videos',
      onPress: () => onSetVideosVisible(true),
    })
  }

  const noteIcon = useCallback(
    (props: { size: number; color: ColorValue }) => (
      <NoteButton note={keyNote} {...props} />
    ),
    [keyNote],
  )

  const memoizedSheetMusic = useMemo(
    () => <SheetMusic uri={tag.uri} onPress={onBrightenThenFade} />,
    [onBrightenThenFade, tag.uri],
  )

  const AppAction = useCallback(
    (props: AppActionProps) => {
      return (
        <Appbar.Action
          icon={props.icon}
          color={theme.colors.primary}
          onPress={() => {
            onBrightenThenFade()
            props.onPress()
          }}
          onPressIn={props.onPressIn}
          onPressOut={props.onPressOut}
          disabled={props.disabled}
          size={BIG_BUTTON_SIZE}
          style={styles.dimmableIconHolderStyle}
        />
      )
    },
    [onBrightenThenFade, styles.dimmableIconHolderStyle, theme.colors.primary],
  )

  return (
    <View style={CommonStyles.container}>
      {memoizedSheetMusic}
      <View style={styles.topBarStyle} pointerEvents="box-none">
        <View style={styles.baseStyles.topBarRow}>
          <Appbar.BackAction
            color={theme.colors.primary}
            onPress={onBack}
            size={SMALL_BUTTON_SIZE}
            style={styles.backButtonStyle}
          />
          <View style={styles.themedStyles.idHolder}>
            <Text style={styles.themedStyles.id}># {tag.id}</Text>
          </View>
        </View>
        <View style={styles.baseStyles.topBarRow}>
          <Appbar.Action
            icon={favoritesById[tag.id] ? 'heart' : 'heart-outline'}
            onPress={() => onToggleFavorite(tag.id)}
            color={theme.colors.primary}
            size={SMALL_BUTTON_SIZE}
            style={styles.fabButtonStyle}
          />
          <Appbar.Action
            icon={fabOpen ? 'minus' : 'cog-outline'}
            onPress={() => onSetFabOpen(!fabOpen)}
            color={theme.colors.primary}
            size={SMALL_BUTTON_SIZE}
            style={styles.fabButtonStyle}
          />
        </View>
      </View>
      <FABDown
        icon={fabOpen ? 'minus' : 'cog-outline'}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({ open }) => {
          onDimButtons()
          onSetFabOpen(open)
        }}
        style={styles.fabGroupStyle}
        fabStyle={styles.fabHiddenStyle}
        theme={theme}
      />
      <View style={styles.bottomActionBarStyle} pointerEvents="box-none">
        {buttonsDimmed ? null : (
          <>
            <Appbar.Action
              icon={noteIcon}
              onPress={() => {
                // handler required for onPressIn to be handled
              }}
              onPressIn={async () => {
                noteHandler.onPressIn()
                onBrightenButtons()
              }}
              onPressOut={async () => {
                noteHandler.onPressOut()
                onBrightenThenFade()
              }}
              color={theme.colors.primary}
              size={BIG_BUTTON_SIZE}
              style={styles.dimmableIconHolderStyle}
            />
            <AppAction
              icon={playingState === PlayingState.playing ? 'pause' : 'play'}
              onPress={async () => {
                onPlayOrPause()
              }}
              disabled={!hasTracks}
            />
          </>
        )}
        {dimAdditionalActions && buttonsDimmed ? null : additionalActions}
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
          onDismiss={() => onSetInfoVisible(false)}
          style={styles.themedStyles.modal}
        >
          <TagInfoView tag={tag} tagListType={tagListType} />
        </Modal>
        {hasVideos ? (
          <Modal
            visible={videosVisible}
            onDismiss={() => onSetVideosVisible(false)}
            style={styles.videoModalStyle}
          >
            <VideoView tag={tag} />
          </Modal>
        ) : null}
        <Modal
          visible={tracksVisible}
          onDismiss={() => onSetTracksVisible(false)}
          style={styles.themedStyles.modal}
        >
          <TrackMenu onDismiss={() => onSetTracksVisible(false)} />
        </Modal>
        {videosVisible ? (
          <IconButton
            icon="close"
            mode="contained"
            onPress={() => onSetVideosVisible(false)}
            style={styles.modalCloseButtonStyle}
          />
        ) : null}
      </SafeAreaInsetsContext.Provider>
    </View>
  )
}
