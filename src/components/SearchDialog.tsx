import { Text } from '@app/components/Text'
import { Collection, Parts } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { SearchFilters, newSearch, selectSearchResults } from '@app/modules/searchSlice'
import { useMemo, useState } from 'react'
import { Keyboard, Pressable, StyleSheet, View } from 'react-native'
import { Searchbar, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  query: string
  filters: SearchFilters
  dismiss: () => void
}

type PickerOption = { value: string; label: string }

type SegmentedPickerProps =
  | { value: string; onValueChange: (v: string) => void; options: PickerOption[] }
  | { values: string[]; onToggle: (v: string) => void; options: PickerOption[] }

function SegmentedPicker(props: SegmentedPickerProps) {
  const theme = useTheme()
  const isMulti = 'values' in props
  return (
    <View style={[pickerStyles.container, { borderColor: theme.colors.outline }]}>
      {props.options.map((option, i) => {
        const selected = isMulti
          ? props.values.includes(option.value)
          : option.value === props.value
        return (
          <Pressable
            key={option.value}
            style={[
              pickerStyles.button,
              i !== 0 && [pickerStyles.divider, { borderLeftColor: theme.colors.outline }],
              selected && { backgroundColor: theme.colors.secondaryContainer },
            ]}
            onPress={() =>
              isMulti ? props.onToggle(option.value) : props.onValueChange(option.value)
            }
          >
            <Text
              style={[
                pickerStyles.label,
                {
                  color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                },
              ]}
              maxFontSizeMultiplier={SEARCH_MAX_FONT}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const pickerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
  },
  divider: {
    borderLeftWidth: 1,
  },
})

const SEARCH_MAX_FONT = 1.3

const staticStyles = StyleSheet.create({
  searchInput: {
    borderWidth: 0,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  searchBar: {
    margin: 10,
  },
  filtersContainer: {
    paddingHorizontal: 10,
  },
  segmentedSection: {
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    paddingLeft: 4,
    paddingBottom: 6,
  },
})

export default function SearchDialog(props: Props) {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { query, filters, dismiss } = props
  const [draftFilters, setDraftFilters] = useState(filters)
  const [draftQuery, setDraftQuery] = useState(query)
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const allTagIds = useAppSelector(state => selectSearchResults(state).allTagIds)

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingTop: insets.top,
          paddingLeft,
          paddingRight,
        },
      }),
    [insets.top, paddingLeft, paddingRight],
  )

  const existingSearchResults = allTagIds.length > 0

  return (
    <View style={dynamicStyles.container}>
      <Searchbar
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        autoFocus={true}
        icon={existingSearchResults ? 'chevron-left' : () => null}
        inputStyle={staticStyles.searchInput}
        maxFontSizeMultiplier={SEARCH_MAX_FONT}
        multiline={false}
        numberOfLines={1}
        onChangeText={setDraftQuery}
        onIconPress={existingSearchResults ? dismiss : () => null}
        placeholder="search for tags"
        placeholderTextColor={theme.colors.secondary}
        value={draftQuery}
        onSubmitEditing={async () => {
          dismiss()
          dispatch(
            newSearch({
              query: draftQuery,
              filters: draftFilters,
            }),
          )
        }}
        spellCheck={false}
        style={staticStyles.searchBar}
        testID="search_input"
      />
      <Pressable onPress={Keyboard.dismiss}>
        <View style={staticStyles.filtersContainer}>
          <View style={staticStyles.segmentedSection}>
            <Text
              variant="labelLarge"
              style={[staticStyles.sectionLabel, { color: theme.colors.primary }]}
              maxFontSizeMultiplier={SEARCH_MAX_FONT}
            >
              collection
            </Text>
            <SegmentedPicker
              value={draftFilters.collection}
              onValueChange={value =>
                setDraftFilters({ ...draftFilters, collection: value as Collection })
              }
              options={[
                { value: Collection.ALL, label: 'all' },
                { value: Collection.CLASSIC, label: 'classic' },
                { value: Collection.EASY, label: 'easy' },
              ]}
            />
          </View>
          <View style={staticStyles.segmentedSection}>
            <Text
              variant="labelLarge"
              style={[staticStyles.sectionLabel, { color: theme.colors.primary }]}
              maxFontSizeMultiplier={SEARCH_MAX_FONT}
            >
              parts
            </Text>
            <SegmentedPicker
              value={draftFilters.parts || Parts.any}
              onValueChange={value => setDraftFilters({ ...draftFilters, parts: value as Parts })}
              options={[
                { value: Parts.any, label: 'any' },
                { value: Parts.four, label: '4' },
                { value: Parts.five, label: '5' },
                { value: Parts.six, label: '6' },
              ]}
            />
          </View>
        </View>
      </Pressable>
      <View style={staticStyles.filtersContainer}>
        <View style={staticStyles.segmentedSection}>
          <Text
            variant="labelLarge"
            style={[staticStyles.sectionLabel, { color: theme.colors.primary }]}
            maxFontSizeMultiplier={SEARCH_MAX_FONT}
          >
            media
          </Text>
          <SegmentedPicker
            values={[
              ...(draftFilters.sheetMusic ? ['sheetMusic'] : []),
              ...(draftFilters.learningTracks ? ['learningTracks'] : []),
            ]}
            onToggle={value => {
              if (value === 'sheetMusic') {
                setDraftFilters({ ...draftFilters, sheetMusic: !draftFilters.sheetMusic })
              } else {
                setDraftFilters({ ...draftFilters, learningTracks: !draftFilters.learningTracks })
              }
            }}
            options={[
              { value: 'sheetMusic', label: 'sheet music' },
              { value: 'learningTracks', label: 'tracks' },
            ]}
          />
        </View>
      </View>
    </View>
  )
}
