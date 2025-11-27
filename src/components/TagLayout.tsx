import Tag from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import { ColorValue, View } from 'react-native'
import { Appbar, Text, useTheme } from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
import CommonStyles from '../constants/CommonStyles'
import { noteForKey, useNotePlayer } from '../hooks/useNotePlayer'
import { FABDown } from './FABDown'
import NoteButton from './NoteButton'
import SheetMusic from './SheetMusic'
import TagInfoView from './TagInfoView'
import TrackMenu from './TrackMenu'

const SMALL_BUTTON_SIZE = 26
const BIG_BUTTON_SIZE = 40

type AppActionProps = {
  icon: string | IconSource
  onPress: () => void
  disabled?: boolean
  onPressIn?: () => void
  onPressOut?: () => void
}

interface TagLayoutProps {
  tag: Tag
  tagListType: TagListEnum
  favoritesById: Record<number, any>
  audioPlaying: boolean
  buttonsDimmed: boolean
  tracksVisible: boolean
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
  onSetInfoVisible: (visible: boolean) => void
  onSetFabOpen: (open: boolean) => void
  onNavigateToTagLabels: () => void
  onNavigateToVideos: () => void
  onPlayTrack?: (url: string) => void
  styles: any
  additionalActions?: ReactNode
  dimAdditionalActions?: boolean
}

export const TagLayout = ({
  tag,
  tagListType,
  favoritesById,
  audioPlaying,
  buttonsDimmed,
  tracksVisible,
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
  onSetInfoVisible,
  onSetFabOpen,
  onNavigateToTagLabels,
  onNavigateToVideos,
  onPlayTrack,
  styles,
  additionalActions,
  dimAdditionalActions = false,
}: TagLayoutProps) => {
  const theme = useTheme()
  const keyNote = noteForKey(tag.key)
  const { onPressIn: noteOnPressIn, onPressOut: noteOnPressOut } =
    useNotePlayer(keyNote)

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const tracksSheetRef = useRef<BottomSheetModal>(null)
  const infoSnapPoints = useMemo(() => ['75%', '90%'], [])
  const tracksSnapPoints = useMemo(() => ['75%', '90%'], [])

  useEffect(() => {
    if (infoVisible) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [infoVisible])

  useEffect(() => {
    if (tracksVisible) {
      tracksSheetRef.current?.present()
    } else {
      tracksSheetRef.current?.dismiss()
    }
  }, [tracksVisible])

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  )

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
      onPress: onNavigateToVideos,
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

  const handleNotePressIn = useCallback(() => {
    noteOnPressIn()
    // Defer state update to avoid re-render during touch event
    setTimeout(() => onBrightenButtons(), 0)
  }, [noteOnPressIn, onBrightenButtons])

  const handleNotePressOut = useCallback(() => {
    noteOnPressOut()
    // Defer state update to avoid re-render during touch event
    setTimeout(() => onBrightenThenFade(), 0)
  }, [noteOnPressOut, onBrightenThenFade])

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
    <BottomSheetModalProvider>
      <View style={CommonStyles.container}>
        {memoizedSheetMusic}
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
        <View style={styles.topBarStyle} pointerEvents="box-none">
          <View style={[styles.baseStyles.topBarRow, styles.topBarLeftStyle]}>
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
              style={[styles.fabButtonStyle, styles.heartIconStyle]}
            />
            <Appbar.Content title="" style={styles.fabIconReplacementStyle} />
            <Appbar.Action
              icon={fabOpen ? 'minus' : 'cog-outline'}
              onPress={() => onSetFabOpen(!fabOpen)}
              color={theme.colors.primary}
              size={SMALL_BUTTON_SIZE}
              style={styles.fabButtonStyle}
            />
          </View>
        </View>
        <View style={styles.bottomActionBarStyle} pointerEvents="box-none">
          {buttonsDimmed ? null : (
            <>
              <Appbar.Action
                icon={noteIcon}
                onPress={() => {
                  // handler required for onPressIn to be handled
                }}
                onPressIn={handleNotePressIn}
                onPressOut={handleNotePressOut}
                color={theme.colors.primary}
                size={BIG_BUTTON_SIZE}
                style={styles.dimmableIconHolderStyle}
              />
              <AppAction
                icon={audioPlaying ? 'pause' : 'play'}
                onPress={async () => {
                  onPlayOrPause()
                }}
                disabled={!hasTracks}
              />
            </>
          )}
          {dimAdditionalActions && buttonsDimmed ? null : additionalActions}
        </View>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={infoSnapPoints}
          enablePanDownToClose
          onDismiss={() => onSetInfoVisible(false)}
          backgroundStyle={{ backgroundColor: theme.colors.surface }}
          handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
          backdropComponent={renderBackdrop}
          android_keyboardInputMode="adjustResize"
        >
          <TagInfoView tag={tag} tagListType={tagListType} />
        </BottomSheetModal>
        <BottomSheetModal
          ref={tracksSheetRef}
          snapPoints={tracksSnapPoints}
          enablePanDownToClose
          onDismiss={() => onSetTracksVisible(false)}
          backgroundStyle={{ backgroundColor: theme.colors.surface }}
          handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
          backdropComponent={renderBackdrop}
          android_keyboardInputMode="adjustResize"
        >
          <TrackMenu
            onDismiss={() => onSetTracksVisible(false)}
            onPlayTrack={onPlayTrack}
          />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  )
}
