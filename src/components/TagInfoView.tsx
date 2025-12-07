import { useWindowShape } from '@app/hooks/useWindowShape'
import Tag from '@app/lib/models/Tag'
import { TagListType } from '@app/modules/tagLists'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import React, { useMemo } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { Divider, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { arranger } from './tagInfo'

const TagInfoView = (props: { tag: Tag; tagListType: TagListType }) => {
  const { tag } = props
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { landscape } = useWindowShape()

  const outerContainerPadding = useMemo(
    () => ({
      paddingHorizontal: landscape
        ? Math.max(60, insets.left + 20, insets.right + 20)
        : Math.max(20, insets.left + 20, insets.right + 20),
    }),
    [landscape, insets.left, insets.right],
  )

  const items: [string, string | number | undefined][] = useMemo(() => {
    return [
      ['aka', tag.aka],
      ['id', tag.id],
      ['arranger', arranger(tag)],
      ['posted', tag.posted],
      ['parts', tag.parts],
      ['lyrics', tag.lyrics],
    ]
  }, [tag])

  return (
    <BottomSheetView style={[styles.outerContainer, outerContainerPadding]}>
      <View style={styles.innerContainer}>
        <Text style={styles.infoTitle} variant="titleLarge">
          {tag.title}
        </Text>
        <Divider
          bold
          style={[
            styles.divider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.listContainer}>
          <InfoItems items={items} />
          <TracksInfo tag={tag} />
        </View>
      </View>
    </BottomSheetView>
  )
}

function InfoItems(props: { items: [string, string | number | undefined][] }) {
  const { items } = props
  return items ? (
    <>
      {items.map(([key, value], id) =>
        value ? (
          <InfoItem infoName={key} infoValue={value} key={`infoitem${id}`} />
        ) : null,
      )}
    </>
  ) : null
}

function TracksInfo(props: { tag: Tag }) {
  const { tag } = props
  if (tag.quartet) {
    if (tag.quartetUrl?.startsWith('http')) {
      return (
        <View style={styles.infoItemRow}>
          <Text style={styles.infoName} numberOfLines={1}>
            tracks:{' '}
          </Text>
          <Text
            style={styles.infoValue}
            numberOfLines={2}
            onPress={() => Linking.openURL(tag.quartetUrl!)}
          >
            <Text style={styles.link}>{tag.quartet}</Text>
          </Text>
        </View>
      )
    } else {
      return <InfoItem infoName="tracks" infoValue={tag.quartet} />
    }
  }
  return null
}

const InfoItem = React.memo(
  (props: { infoName: string; infoValue: string | number }) => {
    const { infoName, infoValue } = props
    return (
      <View style={styles.infoItemRow}>
        <Text style={styles.infoName} numberOfLines={1}>
          {infoName}:{' '}
        </Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {infoName === 'lyrics' ? truncateLyrics(`${infoValue}`) : infoValue}
        </Text>
      </View>
    )
  },
)

const MAX_LENGTH = 80

function truncateLyrics(lyrics: string): string {
  const length = lyrics.length
  if (length <= MAX_LENGTH) {
    return lyrics
  }
  const spaceIndex = lyrics.lastIndexOf(' ', MAX_LENGTH)
  const truncIndex = spaceIndex > MAX_LENGTH - 20 ? spaceIndex : MAX_LENGTH
  return lyrics.substring(0, truncIndex) + ' …'
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
  },
  divider: {
    marginVertical: 10,
  },
  listContainer: {
    paddingTop: 10,
  },
  innerContainer: {
    paddingTop: 10,
    paddingBottom: 50,
    maxWidth: '95%',
  },
  infoTitle: {
    marginLeft: 3,
  },
  infoItemRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    gap: 10,
  },
  infoName: {
    minWidth: 70,
    fontSize: 14,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 15,
    flexShrink: 1,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#4444ff',
  },
})

export default TagInfoView
