import { BottomSheetView } from '@gorhom/bottom-sheet'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Divider, Menu, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from '../hooks'
import { TrackPart } from '../lib/models/Tag'
import { setSelectedPart } from '../modules/tracksSlice'

type TrackMenuProps = {
  onDismiss: () => void
  setTrackUrl?: (url: string | null) => void
}

export default function TrackMenu(props: TrackMenuProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { onDismiss, setTrackUrl } = props
  const tracksState = useAppSelector(state => state.tracks)
  const { selectedPart, tagTracks } = tracksState
  const dispatch = useAppDispatch()

  const styles = StyleSheet.create({
    outerContainer: {
      paddingHorizontal: Math.max(20, insets.left + 20, insets.right + 20),
      alignItems: 'center',
    },
    container: {
      paddingVertical: 12,
      paddingLeft: 8,
      paddingRight: 4,
      maxWidth: '100%',
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
      color: theme.colors.background,
    },
  })

  function playPart(part: string) {
    dispatch(setSelectedPart(part as TrackPart))
    const track = tagTracks[part as TrackPart]
    if (track?.url && setTrackUrl) {
      setTrackUrl(track.url)
    }
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
    <BottomSheetView style={styles.outerContainer}>
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
    </BottomSheetView>
  )
}
