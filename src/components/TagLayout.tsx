import CommonStyles from '@app/constants/CommonStyles'
import {
  noteForKey,
  useAppSelector,
  useButtonDimming,
  useNotePlayer,
  useTagHistory,
  useTagMedia,
  useTagScreenStyles,
  useTagTracks,
  useTrackPlayer,
} from '@app/hooks'
import Tag from '@app/lib/models/Tag'
import { TrackLoadingSpinner } from '@app/lib/theme'
import { TagListEnum } from '@app/modules/tagLists'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ColorValue, View } from 'react-native'
import {
  ActivityIndicator,
  IconButton,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
import { FABDown } from './FABDown'
import NoteButton from './NoteButton'
import SharedHeader, { BackType } from './SharedHeader'
import SheetMusic from './SheetMusic'
import TagInfoView from './TagInfoView'
import TrackMenu from './TrackMenu'

const SMALL_BUTTON_SIZE = 26
const BIG_BUTTON_SIZE = 40

// memoized component to prevent re-renders during rapid state changes
const PlayPauseAction = React.memo(
  ({
    isPlaying,
    isLoading,
    onPress,
    disabled,
    brightenThenFade,
    styles,
    theme,
  }: {
    isPlaying: boolean
    isLoading: boolean
    onPress: () => void
    disabled: boolean
    brightenThenFade: () => void
    styles: any
    theme: any
  }) => {
    const icon = isPlaying ? 'pause' : 'play'
    return (
      <View>
        <IconButton
          icon={icon}
          iconColor={theme.colors.primary}
          onPress={() => {
            console.log('[TagLayout] PlayPause pressed:', icon)
            onPress()
            // Defer state update to avoid re-render during touch event
            setTimeout(() => brightenThenFade(), 0)
          }}
          disabled={disabled}
          size={BIG_BUTTON_SIZE}
          style={styles.dimmableIconHolder}
        />
        {isLoading && (
          <View style={styles.spinnerOverlay} pointerEvents="none">
            <ActivityIndicator
              size={BIG_BUTTON_SIZE + 16}
              color={TrackLoadingSpinner}
            />
          </View>
        )}
      </View>
    )
  },
)

// memoized component for navigation actions (next/prev)
const NavigationActionButton = React.memo(
  ({
    icon,
    onPress,
    disabled,
    brightenThenFade,
    styles,
    theme,
  }: {
    icon: string | IconSource
    onPress: () => void
    disabled: boolean
    brightenThenFade: () => void
    styles: any
    theme: any
  }) => {
    return (
      <IconButton
        icon={icon}
        iconColor={theme.colors.primary}
        onPress={() => {
          console.log('[TagLayout] Navigation action pressed:', icon)
          onPress()
          // defer state update to avoid re-render during touch event
          setTimeout(() => brightenThenFade(), 0)
        }}
        disabled={disabled}
        size={BIG_BUTTON_SIZE}
        style={styles.dimmableIconHolder}
      />
    )
  },
)

interface TagLayoutProps {
  tag: Tag
  tagListType: TagListEnum
  favoritesById: Record<number, any>
  onToggleFavorite: (id: number) => void
  onBack: () => void
  navigationActions?: NavigationAction[]
}

interface NavigationAction {
  icon: string | IconSource
  onPress: () => void
  disabled?: () => boolean
}

export const TagLayout = ({
  tag,
  tagListType,
  favoritesById,
  onToggleFavorite,
  onBack,
  navigationActions,
}: TagLayoutProps) => {
  const theme = useTheme()
  const navigation = useNavigation()
  const keepAwakeEnabled = useAppSelector(state => state.options.keepAwake)
  const keyNote = noteForKey(tag.key)
  const { onPressIn: noteOnPressIn, onPressOut: noteOnPressOut } =
    useNotePlayer(keyNote)

  const [tracksVisible, setTracksVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const { hasTracks, hasVideos } = useTagMedia(tag)
  const {
    trackPlaying,
    isLoading,
    setTrackUrl,
    playOrPause,
    pause,
    error,
    clearError,
  } = useTrackPlayer()

  // Debug logging for error state
  useEffect(() => {
    if (error) {
      console.log('[TagLayout] Track player error:', error)
    }
  }, [error])

  const { buttonsDimmed, brightenButtons, dimButtons, brightenThenFade } =
    useButtonDimming()

  const styles = useTagScreenStyles(buttonsDimmed, fabOpen)

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const tracksSheetRef = useRef<BottomSheetModal>(null)
  const infoSnapPoints = useMemo(() => ['75%', '90%'], [])
  const tracksSnapPoints = useMemo(() => ['75%', '90%'], [])

  useTagHistory(tag)
  useTagTracks(tag)

  // Keep screen awake when viewing a tag if setting is enabled
  useEffect(() => {
    if (keepAwakeEnabled) {
      activateKeepAwakeAsync('tag-viewing')
    }
    return () => {
      if (keepAwakeEnabled) {
        deactivateKeepAwake('tag-viewing')
      }
    }
  }, [keepAwakeEnabled])

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
      onPress: () => setInfoVisible(true),
    },
    {
      icon: 'tag-outline',
      label: 'labels',
      onPress: () => navigation.navigate('TagLabels'),
    },
  ]

  if (hasTracks) {
    fabActions.push({
      icon: 'headphones',
      label: 'tracks',
      onPress: () => setTracksVisible(true),
    })
  }

  if (hasVideos) {
    fabActions.push({
      icon: 'video-box',
      label: 'videos',
      onPress: () => {
        pause()
        navigation.navigate('TagVideos', { tag })
      },
    })
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

  const handleNotePressIn = useCallback(() => {
    noteOnPressIn()
    // Defer state update to avoid re-render during touch event
    setTimeout(() => brightenButtons(), 0)
  }, [noteOnPressIn, brightenButtons])

  const handleNotePressOut = useCallback(() => {
    noteOnPressOut()
    // Defer state update to avoid re-render during touch event
    setTimeout(() => brightenThenFade(), 0)
  }, [noteOnPressOut, brightenThenFade])

  const handlePlayOrPause = useCallback(() => {
    playOrPause()
  }, [playOrPause])

  const title = (
    <View style={styles.idHolder}>
      <Text style={styles.id}># {tag.id}</Text>
    </View>
  )

  const headerRight = useCallback(
    (_props: any) => (
      <View style={styles.headerRight}>
        <View style={styles.headerSpacer} />
        <IconButton
          icon={favoritesById[tag.id] ? 'heart' : 'heart-outline'}
          onPress={() => onToggleFavorite(tag.id)}
          iconColor={theme.colors.primary}
          size={SMALL_BUTTON_SIZE}
          style={styles.menuButton}
        />
        <IconButton
          icon="menu"
          onPress={() => setFabOpen(!fabOpen)}
          iconColor={theme.colors.primary}
          size={SMALL_BUTTON_SIZE}
          style={styles.menuButton}
        />
      </View>
    ),
    [tag.id, favoritesById, onToggleFavorite, fabOpen, styles, theme],
  )

  return (
    <BottomSheetModalProvider>
      <View style={CommonStyles.container}>
        {memoizedSheetMusic}
        <View style={styles.headerHolder}>
          <SharedHeader
            backType={BackType.Back}
            onBack={onBack}
            backIconColor={theme.colors.primary}
            headerRight={headerRight}
            headerStyle={styles.header}
            headerCenterStyle={styles.headerCenter}
            title={title}
          />
        </View>
        <View style={styles.bottomActionBar} pointerEvents="box-none">
          <IconButton
            icon={noteIcon}
            onPressIn={handleNotePressIn}
            onPressOut={handleNotePressOut}
            iconColor={theme.colors.primary}
            size={BIG_BUTTON_SIZE}
            style={styles.dimmableIconHolder}
          />
          <PlayPauseAction
            isPlaying={trackPlaying}
            isLoading={isLoading}
            onPress={handlePlayOrPause}
            disabled={!hasTracks}
            brightenThenFade={brightenThenFade}
            styles={styles}
            theme={theme}
          />
          <View style={styles.headerSpacer} pointerEvents="none" />
          {navigationActions &&
            navigationActions.map((action, index) => (
              <NavigationActionButton
                key={index}
                icon={action.icon}
                onPress={() => {
                  pause()
                  action.onPress()
                }}
                disabled={action.disabled ? action.disabled() : false}
                brightenThenFade={brightenThenFade}
                styles={styles}
                theme={theme}
              />
            ))}
        </View>
        <Portal>
          <FABDown
            open={fabOpen}
            actions={fabActions}
            onStateChange={({ open }) => {
              dimButtons()
              setFabOpen(open)
            }}
            style={styles.fabGroup}
            fabStyle={styles.fabHidden}
            theme={theme}
          />
        </Portal>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={infoSnapPoints}
          enablePanDownToClose
          onDismiss={() => setInfoVisible(false)}
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
          onDismiss={() => setTracksVisible(false)}
          backgroundStyle={{ backgroundColor: theme.colors.surface }}
          handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
          backdropComponent={renderBackdrop}
          android_keyboardInputMode="adjustResize"
        >
          <TrackMenu
            onDismiss={() => setTracksVisible(false)}
            setTrackUrl={setTrackUrl}
          />
        </BottomSheetModal>
        <Portal>
          <Snackbar
            visible={!!error}
            onDismiss={clearError}
            duration={4000}
            action={{
              label: 'dismiss',
              onPress: clearError,
            }}
          >
            {error}
          </Snackbar>
        </Portal>
      </View>
    </BottomSheetModalProvider>
  )
}
