import CommonStyles from '@app/constants/CommonStyles'
import {
  noteForKey,
  useButtonDimming,
  useNotePlayer,
  useTagEffects,
  useTagMedia,
  useTagScreenStyles,
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ColorValue, View } from 'react-native'
import {
  ActivityIndicator,
  Appbar,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
import { FABDown } from './FABDown'
import NoteButton from './NoteButton'
import SheetMusic from './SheetMusic'
import TagInfoView from './TagInfoView'
import TrackMenu from './TrackMenu'

const SMALL_BUTTON_SIZE = 26
const BIG_BUTTON_SIZE = 40

const spinnerOverlayStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
}

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
        <Appbar.Action
          icon={icon}
          color={theme.colors.primary}
          onPress={() => {
            console.log('[TagLayout] PlayPause pressed:', icon)
            onPress()
            // Defer state update to avoid re-render during touch event
            setTimeout(() => brightenThenFade(), 0)
          }}
          disabled={disabled}
          size={BIG_BUTTON_SIZE}
          style={styles.dimmableIconHolderStyle}
        />
        {isLoading && (
          <View style={spinnerOverlayStyle} pointerEvents="none">
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
      <Appbar.Action
        icon={icon}
        color={theme.colors.primary}
        onPress={() => {
          console.log('[TagLayout] Navigation action pressed:', icon)
          onPress()
          // defer state update to avoid re-render during touch event
          setTimeout(() => brightenThenFade(), 0)
        }}
        disabled={disabled}
        size={BIG_BUTTON_SIZE}
        style={styles.dimmableIconHolderStyle}
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

  useTagEffects(tag)

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

  return (
    <BottomSheetModalProvider>
      <View style={CommonStyles.container}>
        {memoizedSheetMusic}
        <FABDown
          icon={fabOpen ? 'minus' : 'cog-outline'}
          open={fabOpen}
          actions={fabActions}
          onStateChange={({ open }) => {
            dimButtons()
            setFabOpen(open)
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
            <Appbar.Content title=" " style={styles.baseStyles.topBarSpacer} />
            <Appbar.Action
              icon={favoritesById[tag.id] ? 'heart' : 'heart-outline'}
              onPress={() => onToggleFavorite(tag.id)}
              color={theme.colors.primary}
              size={SMALL_BUTTON_SIZE}
              style={styles.fabButtonStyle}
            />
          </View>
          <Appbar.Action
            icon={fabOpen ? 'minus' : 'cog-outline'}
            onPress={() => setFabOpen(!fabOpen)}
            color={theme.colors.primary}
            size={SMALL_BUTTON_SIZE}
            style={styles.fabButtonStyle}
          />
        </View>
        <View style={styles.bottomActionBarStyle} pointerEvents="box-none">
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
          <PlayPauseAction
            isPlaying={trackPlaying}
            isLoading={isLoading}
            onPress={handlePlayOrPause}
            disabled={!hasTracks}
            brightenThenFade={brightenThenFade}
            styles={styles}
            theme={theme}
          />
          <Appbar.Content title=" " pointerEvents="none" />
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
