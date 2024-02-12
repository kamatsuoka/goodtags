import {useAppDispatch, useAppSelector} from "@app/hooks"
import useSelectedTag from "@app/hooks/useSelectedTag"
import Tag from "@app/lib/models/Tag"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {TagListType} from "@app/modules/tagLists"
import {StackParamList} from "@app/navigation/navigationParams"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {Platform, ScrollView, StyleSheet, View} from "react-native"
import {Button, Checkbox, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

const LabelSelector = (props: {
  tag: Tag
  label: string
  tagListType: TagListType
  selected: boolean
}) => {
  const dispatch = useAppDispatch()
  const {tag, label, tagListType, selected} = props
  return (
    <View style={styles.labelSelector}>
      <Checkbox.Item
        mode="android" // lack of placeholder on ios is confusing
        status={selected ? "checked" : "unchecked"}
        label={label}
        onPress={() => {
          selected
            ? dispatch(
                FavoritesActions.removeLabel({id: tag.id, label, tagListType}),
              )
            : dispatch(FavoritesActions.addLabel({tag, label}))
        }}
        style={styles.checkboxItem}
        position="leading"
      />
    </View>
  )
}

const TagLabels = () => {
  const tagListType = useAppSelector(state => state.visit.tagListType)
  const tag = useSelectedTag(tagListType)
  const labels = useAppSelector(state => state.favorites.labels)
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const selectedLabels = useAppSelector(
    state => state.favorites.labelsByTagId[tag.id],
  )
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      margin: 10,
      borderRadius: 15,
      justifyContent: "space-between",
      paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
    },
    divider: {
      marginTop: 10,
      marginHorizontal: 10,
      backgroundColor: theme.colors.outline,
    },
  })

  return (
    <View style={themedStyles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {labels.map((label, index) => (
            <LabelSelector
              tag={tag}
              label={label}
              selected={selectedLabels?.includes(label)}
              tagListType={tagListType}
              key={`LabelSelector.${index}`}
            />
          ))}
        </View>
      </ScrollView>
      <Button
        icon="plus"
        mode="contained-tonal"
        onPress={() => navigation.navigate("CreateLabel", {tag})}
        style={styles.createButton}>
        new label
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  titleHolder: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
  },
  listContainer: {
    paddingTop: 10,
    paddingLeft: 0,
  },
  labelSelector: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  checkboxItem: {
    paddingVertical: 0,
    paddingLeft: 0,
    marginLeft: 0,
  },
  createButton: {
    alignSelf: "flex-start",
    margin: 15,
  },
})

export default TagLabels
