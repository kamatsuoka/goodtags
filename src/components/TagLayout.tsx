import { useTagEffects } from '@app/hooks/useTagEffects'
import useTagMedia from '@app/hooks/useTagMedia'
import useTagTrackPlayer from '@app/hooks/useTagTrackPlayer'
import Tag from '@app/lib/models/Tag'
import { TagListEnum } from '@app/modules/tagLists'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ColorValue, View } from 'react-native'
import { Appbar, Text, useTheme } from 'react-native-paper'
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon'
import CommonStyles from '../constants/CommonStyles'
import { useButtonDimming } from '../hooks/useButtonDimming'
import { noteForKey, useNotePlayer } from '../hooks/useNotePlayer'
import { useTagScreenStyles } from '../hooks/useTagScreenStyles'
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
  const { audioPlaying, setTrackUrl, playOrPause, pause } = useTagTrackPlayer()

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
          style={styles.dimmableIconHolderStyle}
        />
      )
    },
    [brightenThenFade, styles.dimmableIconHolderStyle, theme.colors.primary],
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
          <AppAction
            icon={audioPlaying ? 'pause' : 'play'}
            onPress={async () => {
              playOrPause()
            }}
            disabled={!hasTracks}
          />
          <Appbar.Content title=" " pointerEvents="none" />
          {navigationActions &&
            navigationActions.map((action, index) => (
              <AppAction
                key={index}
                icon={action.icon}
                onPress={async () => {
                  pause()
                  action.onPress()
                }}
                disabled={action.disabled ? action.disabled() : false}
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
            onPlayTrack={setTrackUrl}
          />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  )
}
