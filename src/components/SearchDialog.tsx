import useHaptics from "@app/hooks/useHaptics"
import {useState} from "react"
import {Keyboard, Pressable, StyleSheet, View} from "react-native"
import {
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Portal,
  RadioButton,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import {Collection, Mode, Parts} from "../constants/Search"
import {useAppDispatch, useAppSelector} from "../hooks"
import {
  SearchFilters,
  newSearch,
  selectSearchResults,
} from "../modules/searchSlice"
import SearchOptions from "./SearchOptions"

type Props = {
  query: string
  filters: SearchFilters
  dismiss: () => void
}
export default function SearchDialog(props: Props) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const haptics = useHaptics()
  const {query, filters, dismiss} = props
  const [draftFilters, setDraftFilters] = useState(filters)
  const [draftQuery, setDraftQuery] = useState(query)
  const insets = useSafeAreaInsets()
  const allTagIds = useAppSelector(
    state => selectSearchResults(state).allTagIds,
  )
  const [modeExplanationDialogVisible, setModeExplanationDialogVisible] =
    useState(false)

  const styles = StyleSheet.create({
    container: {
      // Paddings to handle safe area
      paddingTop: insets.top,
    },
    searchOptions: {
      flexDirection: "row",
      justifyContent: "flex-start",
      flexWrap: "wrap",
      alignItems: "flex-start",
      paddingLeft: 20,
    },
    searchInput: {
      borderWidth: 0,
      borderBottomWidth: 0,
      borderBottomColor: "transparent",
    },
    optionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 5,
    },
    optionText: {
      marginLeft: 5,
    },
    searchBar: {
      margin: 10,
    },
    checkboxItem: {
      paddingLeft: 0,
      paddingRight: 5,
      paddingVertical: 3,
    },
    infoButton: {
      paddingLeft: 0,
      marginHorizontal: 3,
    },
  })

  const existingSearchResults = allTagIds.length > 0

  return (
    <View style={styles.container}>
      <Searchbar
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        autoFocus={true}
        icon={existingSearchResults ? "chevron-left" : () => null}
        inputStyle={styles.searchInput}
        multiline={false}
        numberOfLines={1}
        onChangeText={setDraftQuery}
        onIconPress={existingSearchResults ? dismiss : () => null}
        placeholder="search for tags"
        placeholderTextColor={theme.colors.secondary}
        value={draftQuery}
        onSubmitEditing={async () => {
          await haptics.selectionAsync()
          dismiss()
          dispatch(
            newSearch({
              query: draftQuery,
              filters: draftFilters,
            }),
          )
        }}
        spellCheck={false}
        style={styles.searchBar}
      />
      <Pressable onPress={Keyboard.dismiss}>
        <View style={styles.searchOptions}>
          <SearchOptions title="collection" icon="playlist-music-outline">
            <RadioButton.Group
              onValueChange={value =>
                setDraftFilters({
                  ...draftFilters,
                  collection: value as Collection,
                })
              }
              value={draftFilters.collection}>
              {Object.values(Collection).map(value => {
                return (
                  <View
                    key={`collection_${value}`}
                    style={styles.optionsContainer}>
                    <RadioButton.Item
                      label={value.toLowerCase()}
                      labelStyle={styles.optionText}
                      position="leading"
                      style={styles.checkboxItem}
                      value={value}
                    />
                  </View>
                )
              })}
            </RadioButton.Group>
          </SearchOptions>
          <SearchOptions title="media" icon="music-clef-treble">
            <View style={styles.optionsContainer}>
              <Checkbox.Item
                label="sheet music"
                labelStyle={styles.optionText}
                style={styles.checkboxItem}
                position="leading"
                status={draftFilters.sheetMusic ? "checked" : "unchecked"}
                onPress={() =>
                  setDraftFilters({
                    ...draftFilters,
                    sheetMusic: !draftFilters.sheetMusic,
                  })
                }
              />
            </View>
            <View style={styles.optionsContainer}>
              <Checkbox.Item
                label="tracks"
                labelStyle={styles.optionText}
                style={styles.checkboxItem}
                position="leading"
                status={draftFilters.learningTracks ? "checked" : "unchecked"}
                onPress={() =>
                  setDraftFilters({
                    ...draftFilters,
                    learningTracks: !draftFilters.learningTracks,
                  })
                }
              />
            </View>
          </SearchOptions>
          <SearchOptions title="parts" icon="account-multiple-outline">
            <RadioButton.Group
              onValueChange={value =>
                setDraftFilters({
                  ...draftFilters,
                  parts: value as Parts,
                })
              }
              value={draftFilters.parts || "any"}>
              {Object.values(Parts).map(value => {
                return (
                  <View key={`parts_${value}`} style={styles.optionsContainer}>
                    <RadioButton.Item
                      label={value.toLowerCase()}
                      labelStyle={styles.optionText}
                      position="leading"
                      style={styles.checkboxItem}
                      value={value}
                    />
                  </View>
                )
              })}
            </RadioButton.Group>
          </SearchOptions>
          <SearchOptions title="mode" icon="cog-outline">
            <RadioButton.Group
              onValueChange={value =>
                setDraftFilters({
                  ...draftFilters,
                  mode: value as Mode,
                })
              }
              value={draftFilters.mode}>
              {Object.values(Mode).map(value => {
                return (
                  <View key={`mode_${value}`} style={styles.optionsContainer}>
                    <RadioButton.Item
                      label={value.toLowerCase()}
                      labelStyle={styles.optionText}
                      position="leading"
                      style={styles.checkboxItem}
                      value={value}
                    />
                  </View>
                )
              })}
            </RadioButton.Group>
            <IconButton
              style={styles.infoButton}
              icon="information-outline"
              onPress={() => {
                setModeExplanationDialogVisible(true)
                Keyboard.dismiss()
              }}
            />
          </SearchOptions>
        </View>
      </Pressable>
      <Portal>
        <Dialog
          visible={modeExplanationDialogVisible}
          onDismiss={() => setModeExplanationDialogVisible(false)}
          // It's otherwise a *very* round dialog
          theme={{...theme, roundness: 3}}>
          <Dialog.Title>Search mode</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              The newer offline search is faster but may not show the same
              results, and results may be slightly less up-to-date. Note this is
              just for searching; viewing a non-favorited individual tag still
              requires internet.
            </Text>
            <Dialog.Actions>
              <Button onPress={() => setModeExplanationDialogVisible(false)}>
                Ok
              </Button>
            </Dialog.Actions>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  )
}
