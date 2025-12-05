import { useAppDispatch, useAppSelector } from '@app/hooks'
import { TrackPart } from '@app/lib/models/Tag'
import { setSelectedPart } from '@app/modules/tracksSlice'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Divider, Menu, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
      paddingBottom: Math.max(20, insets.bottom),
      alignItems: 'center',
    },
    container: {
      paddingVertical: 12,
      paddingLeft: 8,
      paddingRight: 4,
      maxWidth: '100%',
    },
    title: {
      paddingTop: 10,
    },
    divider: {
      width: 75,
      marginVertical: 10,
      backgroundColor: theme.colors.outline,
    },
    hiddenDot: {
      color: theme.colors.background,
    },
    part: {
      marginLeft: -29,
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
            style={styles.part}
          />
        ))}
      </View>
    </BottomSheetView>
  )
}
