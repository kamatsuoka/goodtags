import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  ActivityIndicator,
  Button,
  Chip,
  Snackbar,
  useTheme,
} from 'react-native-paper'
import { FABDown } from '../components/FABDown'
import ListHeader from '../components/ListHeader'
import SearchDialog from '../components/SearchDialog'
import TagList from '../components/TagList'
import CommonStyles from '../constants/CommonStyles'
import { Collection, MAX_TAGS, SortOrder } from '../constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '../hooks'
import useFabDownStyle from '../hooks/useFabDownStyle'
import {
  InitialFilters,
  SearchActions,
  isASearchPayload,
  moreSearch,
  newSearch,
  selectSearchResults,
} from '../modules/searchSlice'
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from '../modules/tagLists'

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

  const themedStyles = StyleSheet.create({
    compactSearchLabelEmpty: {
      color: theme.colors.secondary,
    },
    listHolder: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

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
        // elevated={true}
        onPress={() => setSearchMenuVisible(true)}
        textStyle={{ color: theme.colors.primary }}
        style={styles.filterButton}
      >
        {label.toLowerCase()}
      </Chip>
    ) : null

  const dismissSearchDialog = () => {
    setSearchMenuVisible(false)
  }

  const queryButton = (
    <Button
      icon="magnify"
      mode="elevated"
      contentStyle={styles.compactSearchContent}
      onPress={() => {
        return setSearchMenuVisible(true)
      }}
      style={styles.compactSearchBar}
      labelStyle={styles.compactSearchLabel}
    >
      {query}
    </Button>
  )

  return searchMenuVisible ? (
    <SearchDialog
      query={query}
      filters={filters}
      dismiss={dismissSearchDialog}
    />
  ) : (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} title={queryButton} />
      {filters !== InitialFilters ? (
        <View style={styles.filterHolder}>
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
      ) : null}
      <View style={themedStyles.listHolder}>
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
          labelStyle={themedStyles.compactSearchLabelEmpty}
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
        icon={fabOpen ? 'minus' : 'cog-outline'}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({ open }) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        theme={theme}
      />
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginHorizontal: 5,
    margin: 5,
    maxWidth: 200,
  },
  compactSearchContent: {
    height: 40,
  },
  compactSearchLabel: {
    fontSize: 16,
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
  statusText: {
    paddingTop: 2,
    fontSize: 15,
    alignSelf: 'center',
  },
  spinner: {
    height: 60,
  },
})

export default SearchScreen
