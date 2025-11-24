import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Divider, Menu, Text, useTheme } from 'react-native-paper'
import { useAppDispatch, useAppSelector } from '../hooks'
// import useTrackPlayer from '../hooks/useTrackPlayer'
import { TrackPart } from '../lib/models/Tag'
import { setSelectedPart } from '../modules/tracksSlice'

type TrackMenuProps = {
  onDismiss: () => void
}

export default function TrackMenu(props: TrackMenuProps) {
  const theme = useTheme()
  const { onDismiss } = props
  const tracksState = useAppSelector(state => state.tracks)
  const { selectedPart, tagTracks } = tracksState
  const dispatch = useAppDispatch()

  // const { player: trackPlayer } = useTrackPlayer(tracksState.selectedTrack?.url)
  // const selectedTrack = tracksState.selectedTrack

  // useEffect(() => {
  //   // when the selected track changes in the store, start playing it
  //   if (selectedTrack) {
  //     try {
  //       trackPlayer?.play?.()
  //     } catch (e) {
  //       // ignore if player not ready
  //     }
  //   }
  // }, [selectedTrack, trackPlayer])

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.inversePrimary,
      justifyContent: 'center',
      paddingVertical: 12,
      paddingLeft: 8,
      paddingRight: 4,
      borderRadius: 15,
    },
    title: {
      paddingLeft: 26,
      paddingTop: 10,
    },
    divider: {
      marginVertical: 10,
      marginLeft: 10,
      marginRight: 12,
      backgroundColor: theme.colors.outline,
    },
    hiddenDot: {
      color: theme.colors.inversePrimary,
    },
  })

  function playPart(part: string) {
    dispatch(setSelectedPart(part as TrackPart))
    onDismiss()
  }

  const displayName = (part: string) =>
    `${part}`.replace('AllParts', 'All Parts')

  const itemTitle = (part: string) => (
    <Text>
      <Text style={part === selectedPart.toString() ? {} : styles.hiddenDot}>
        •&nbsp;&nbsp;
      </Text>
      <Text>{displayName(part)}</Text>
    </Text>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="titleLarge">
        Tracks
      </Text>
      <Divider bold style={styles.divider} />
      {Object.keys(tagTracks).map(part => (
        <Menu.Item
          dense
          key={part}
          onPress={() => playPart(part)}
          title={itemTitle(part)}
        />
      ))}
    </View>
  )
}
