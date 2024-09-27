import {isFavoriteOrLabel} from "@app/modules/tagListUtil"
import {useMemo} from "react"
import {Linking, StyleSheet, View} from "react-native"
import {Divider, IconButton, Text, useTheme} from "react-native-paper"
import {useAppDispatch} from "../hooks"
import Tag from "../lib/models/Tag"
import {refreshFavorite} from "../modules/favoritesSlice"
import {TagListType} from "../modules/tagLists"
import {arranger, posted} from "./tagInfo"

const TagInfoView = (props: {tag: Tag; tagListType: TagListType}) => {
  const {tag, tagListType} = props
  const theme = useTheme()
  const dispatch = useAppDispatch()

  const themedStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.inversePrimary,
      padding: 20,
      margin: 10,
      borderRadius: 15,
      justifyContent: "space-between",
    },
    divider: {
      marginVertical: 5,
      backgroundColor: theme.colors.outline,
    },
  })

  const items: [string, string | number | undefined][] = useMemo(() => {
    return [
      ["aka", tag.aka],
      ["id", tag.id],
      ["arranger", arranger(tag)],
      ["posted", posted(tag)],
      ["parts", tag.parts],
      ["lyrics", tag.lyrics],
    ]
  }, [tag])

  return (
    <View style={styles.centeredView}>
      <View style={themedStyles.container}>
        <View style={styles.titleHolder}>
          <Text style={styles.infoTitle} variant="titleMedium">
            {tag.title}
          </Text>
          {isFavoriteOrLabel(tagListType) ? (
            <IconButton
              icon="refresh"
              onPress={() => dispatch(refreshFavorite(tag.id))}
            />
          ) : null}
        </View>
        <Divider bold style={themedStyles.divider} />
        <View style={styles.listContainer}>
          <InfoItems items={items} />
          <TracksInfo tag={tag} />
        </View>
      </View>
    </View>
  )
}

function InfoItems(props: {items: [string, string | number | undefined][]}) {
  const {items} = props
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

function TracksInfo(props: {tag: Tag}) {
  const {tag} = props
  if (tag.quartet) {
    if (tag.quartetUrl?.startsWith("http")) {
      return (
        <View style={styles.tracksRow}>
          <Text style={styles.infoName}>tracks: </Text>
          <View style={styles.buttonHolder}>
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(tag.quartetUrl!)}>
              {tag.quartet}
            </Text>
          </View>
        </View>
      )
    } else {
      return <InfoItem infoName="tracks" infoValue={tag.quartet} />
    }
  }
  return null
}

function InfoItem(props: {infoName: string; infoValue: string | number}) {
  const {infoName, infoValue} = props
  return (
    <View style={styles.infoItemRow}>
      <Text style={styles.infoName} numberOfLines={1}>
        {infoName}:{" "}
      </Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {infoName === "lyrics" ? truncateLyrics(`${infoValue}`) : infoValue}
      </Text>
    </View>
  )
}

const MAX_LENGTH = 80

function truncateLyrics(lyrics: string): string {
  const length = lyrics.length
  if (length <= MAX_LENGTH) {
    return lyrics
  }
  const spaceIndex = lyrics.lastIndexOf(" ", MAX_LENGTH)
  const truncIndex = spaceIndex > MAX_LENGTH - 20 ? spaceIndex : MAX_LENGTH
  return lyrics.substring(0, truncIndex) + " …"
}

const styles = StyleSheet.create({
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingTop: 10,
    paddingLeft: 5,
  },
  titleHolder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoTitle: {
    marginLeft: 3,
  },
  infoItemRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 3,
  },
  tracksRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoName: {
    flexBasis: 70,
    fontSize: 14,
  },
  infoValue: {
    flexBasis: 230,
    fontSize: 15,
  },
  buttonHolder: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flex: 3,
  },
  button: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingBottom: 0,
  },
  buttonLabel: {
    fontSize: 14,
    marginVertical: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 2,
    marginBottom: 0,
    paddingBottom: 0,
  },
  link: {
    textDecorationLine: "underline",
    color: "#4444ff",
  },
})

export default TagInfoView
