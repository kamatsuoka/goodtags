import { Text } from '@app/components/Text'
import { Collection, Parts } from '@app/constants/Search'
import { useAppDispatch, useBodyInsets } from '@app/hooks'
import { SearchFilters, newSearch } from '@app/modules/searchSlice'
import { useEffect, useMemo, useState } from 'react'
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Button, Searchbar, useTheme } from 'react-native-paper'
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
            onPress={() => {
              Keyboard.dismiss()
              isMulti ? props.onToggle(option.value) : props.onValueChange(option.value)
            }}
            testID={option.value}
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

const KEYBOARD_SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
const KEYBOARD_HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

const staticStyles = StyleSheet.create({
  searchInput: {
    borderWidth: 0,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  searchBar: {
    marginHorizontal: 20,
    marginVertical: 10,
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
  searchButtonSpacer: {
    flex: 1,
  },
  searchButton: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchButtonLabel: {
    fontWeight: 'normal',
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
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft,
          paddingRight,
        },
      }),
    [insets.top, insets.bottom, paddingLeft, paddingRight],
  )

  const [keyboardVisible, setKeyboardVisible] = useState(true)

  useEffect(() => {
    const show = Keyboard.addListener(KEYBOARD_SHOW_EVENT, () => setKeyboardVisible(true))
    const hide = Keyboard.addListener(KEYBOARD_HIDE_EVENT, () => setKeyboardVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const handleSearch = () => {
    dismiss()
    dispatch(newSearch({ query: draftQuery, filters: draftFilters }))
  }

  return (
    <View style={dynamicStyles.container}>
      <Searchbar
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        autoFocus={true}
        icon="chevron-left"
        inputStyle={staticStyles.searchInput}
        maxFontSizeMultiplier={SEARCH_MAX_FONT}
        multiline={false}
        numberOfLines={1}
        onChangeText={setDraftQuery}
        onIconPress={dismiss}
        placeholder="search for tags"
        placeholderTextColor={theme.colors.secondary}
        value={draftQuery}
        onSubmitEditing={handleSearch}
        spellCheck={false}
        style={staticStyles.searchBar}
        testID="search_input"
      />
      <View style={staticStyles.filtersContainer}>
        <View style={staticStyles.segmentedSection}>
          <Text
            variant="labelLarge"
            style={[staticStyles.sectionLabel, { color: theme.colors.primary }]}
            maxFontSizeMultiplier={SEARCH_MAX_FONT}
            testID="collection"
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
      <View style={staticStyles.searchButtonSpacer} />
      {!keyboardVisible && (
        <Button
          icon="magnify"
          mode="contained"
          onPress={handleSearch}
          style={staticStyles.searchButton}
          labelStyle={staticStyles.searchButtonLabel}
          testID="search_button"
        >
          search
        </Button>
      )}
    </View>
  )
}
