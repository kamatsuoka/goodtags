import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import SearchDialog from '@app/components/SearchDialog'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { Collection, MAX_TAGS, SortOrder } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import {
  InitialFilters,
  SearchActions,
  isASearchPayload,
  moreSearch,
  newSearch,
  selectSearchResults,
} from '@app/modules/searchSlice'
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  ActivityIndicator,
  Button,
  Chip,
  Snackbar,
  useTheme,
} from 'react-native-paper'

/**
 * List of search results.
 */
const SearchScreen = () => {
  const theme = useTheme()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [searchMenuVisible, setSearchMenuVisible] = useState(true)
  const loadingState = useAppSelector(
    state => selectSearchResults(state).loadingState,
  )
  const error = useAppSelector(state => selectSearchResults(state).error)
  const sortOrder = useAppSelector(
    state => selectSearchResults(state).sortOrder,
  )
  const listRef = useRef<FlashListRef<number> | null>(null)
  const moreAvailable = useAppSelector(
    state => state.search.results.moreAvailable,
  )
  const dispatch = useAppDispatch()
  // set draft values of filters, not persisted until search executed
  const filters = useAppSelector(state => state.search.filters)
  // set draft values of query, not persisted until search executed
  const query = useAppSelector(state => state.search.query)
  const [fabOpen, setFabOpen] = useState(false)
  const fabStyleSheet = useFabDownStyle()

  const listHolderPadding = useMemo(
    () => ({
      paddingLeft,
      paddingRight,
    }),
    [paddingLeft, paddingRight],
  )

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  /**
   * When user scrolls to bottom of results, load more
   */
  const loadMore = async (numTags: number): Promise<boolean> => {
    const shouldLoadMore =
      numTags < MAX_TAGS &&
      moreAvailable &&
      loadingState !== LoadingState.pending
    if (shouldLoadMore) {
      const morePayload = await dispatch(moreSearch())
      if (
        morePayload.type.endsWith('/fulfilled') &&
        morePayload.payload &&
        isASearchPayload(morePayload.payload)
      ) {
        return true
      }
    }
    return false
  }
  const statusMessage = () => {
    switch (loadingState) {
      case LoadingState.succeeded:
        return 'no matching tags found'
      case LoadingState.idle:
        return 'tap the search button below to find tags'
    }
    return ''
  }

  const fabActions = [
    ...Object.values(SortOrder)
      .filter(o => o !== sortOrder)
      .map(order => {
        return {
          icon: SORT_ICONS[order],
          label: SORT_LABELS[order],
          onPress: async () => {
            dispatch(newSearch({ sortOrder: order }))
          },
        }
      }),
    {
      icon: 'broom',
      label: 'clear search',
      onPress: async () => {
        dispatch(SearchActions.setLoadingState(LoadingState.idle))
        return dispatch(SearchActions.clearSearch())
      },
    },
  ]

  const getErrorMessage = () => `error fetching tags: ${error}`
  const setIdle = () =>
    dispatch(SearchActions.setLoadingState(LoadingState.idle))

  const filterChip = (visible: boolean, icon: string, label: string) =>
    visible ? (
      <Chip
        icon={icon}
        textStyle={{ color: theme.colors.primary }}
        style={styles.filterButton}
      >
        {label.toLowerCase()}
      </Chip>
    ) : null

  const dismissSearchDialog = () => {
    setSearchMenuVisible(false)
  }

  return searchMenuVisible ? (
    <SearchDialog
      query={query}
      filters={filters}
      dismiss={dismissSearchDialog}
    />
  ) : (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} title="" setFabOpen={setFabOpen} />
      {query ? (
        <View style={styles.searchBarHolder} pointerEvents="box-none">
          <Button
            icon="magnify"
            mode="elevated"
            contentStyle={styles.compactSearchContent}
            onPress={() => setSearchMenuVisible(true)}
            style={styles.compactSearchBar}
            labelStyle={[
              theme.fonts.titleMedium,
              styles.compactSearchLabel,
              { color: theme.colors.secondary },
            ]}
          >
            {query}
          </Button>
        </View>
      ) : null}
      {/* {filters !== InitialFilters ? ( */}
      <View style={styles.filterHolder} pointerEvents="box-none">
        {filterChip(
          filters.collection !== Collection.ALL,
          'playlist-check',
          filters.collection.toString(),
        )}
        {filterChip(
          filters.learningTracks !== InitialFilters.learningTracks,
          'filter-check-outline',
          'tracks',
        )}
        {filterChip(
          filters.parts && filters.parts !== InitialFilters.parts,
          'account-multiple-check-outline',
          `${filters.parts} parts`,
        )}
      </View>
      {/* ) : null} */}
      <View style={[CommonStyles.listContainer, listHolderPadding]}>
        <TagList
          listRef={listRef}
          loadMore={(numTags: number) => loadMore(numTags)}
          emptyMessage={statusMessage()}
          tagListType={TagListEnum.SearchResults}
        />
      </View>
      {loadingState === LoadingState.pending ? (
        <View style={CommonStyles.spinnerHolder}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}
      {loadingState === LoadingState.morePending ? (
        <ActivityIndicator style={styles.spinner} size="small" />
      ) : null}
      <View style={styles.floatingButtonHolder}>
        <Button
          mode="elevated"
          contentStyle={styles.compactSearchContent}
          icon="shimmer"
          onPress={() => {
            dispatch(SearchActions.clearSearch())
            return setSearchMenuVisible(true)
          }}
          style={styles.compactSearchBar}
          labelStyle={[
            theme.fonts.titleMedium,
            styles.compactSearchLabel,
            { color: theme.colors.secondary },
          ]}
        >
          {'new search'}
        </Button>
      </View>
      <Snackbar
        visible={loadingState === LoadingState.failed}
        onDismiss={setIdle}
        onIconPress={setIdle}
      >
        {getErrorMessage()}
      </Snackbar>
      <FABDown
        open={fabOpen}
        actions={fabActions}
        onStateChange={({ open }) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        color={theme.colors.onPrimary}
        theme={theme}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchBarHolder: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  filterHolder: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  filterButton: {
    borderRadius: 0,
    margin: 3,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  compactSearchBar: {
    padding: 0,
    marginHorizontal: 5,
    margin: 0,
    minWidth: 150,
    maxWidth: 200,
  },
  compactSearchContent: {
    height: 40,
  },
  compactSearchLabel: {
    marginVertical: 0,
  },
  container: {
    justifyContent: 'flex-start',
    paddingBottom: 0,
    marginBottom: 0,
  },
  buttonHolder: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  floatingButtonHolder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    pointerEvents: 'box-none',
  },
  spinner: {
    height: 60,
  },
})

export default SearchScreen
