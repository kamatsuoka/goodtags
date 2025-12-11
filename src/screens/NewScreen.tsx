import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import { AppDispatch, useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { NewActions, getNewTags, selectNew } from '@app/modules/newSlice'
import { LoadingState, SORT_ICONS, SORT_LABELS, TagListEnum } from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { ActivityIndicator, Snackbar, useTheme } from 'react-native-paper'

/**
 * New tags
 */
const NewScreen = () => {
  const theme = useTheme()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch: AppDispatch = useAppDispatch()
  const loadingState = useAppSelector(state => selectNew(state).loadingState)
  const error = useAppSelector(state => selectNew(state).error)
  const sortOrder = useAppSelector(state => selectNew(state).sortOrder)
  const listRef = useRef<FlashListRef<number> | null>(null)
  const fabStyleSheet = useFabDownStyle()

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  useEffect(() => {
    dispatch(getNewTags(false))
  }, [dispatch])

  const otherOrder = sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const fabActions = useMemo(
    () => [
      {
        icon: SORT_ICONS[otherOrder],
        label: SORT_LABELS[otherOrder],
        onPress: async () => {
          return dispatch(NewActions.toggleSortOrder())
        },
      },
      {
        icon: 'reload',
        label: 'reload new tags',
        onPress: async () => {
          return dispatch(getNewTags(true))
        },
      },
      {
        icon: 'broom',
        label: 'clear new tags',
        onPress: async () => {
          return dispatch(NewActions.reset())
        },
      },
    ],
    [otherOrder, dispatch],
  )

  const setIdle = useCallback(
    () => dispatch(NewActions.setLoadingState(LoadingState.idle)),
    [dispatch],
  )

  const listContainerPadding = useMemo(
    () => ({
      paddingLeft,
      paddingRight,
    }),
    [paddingLeft, paddingRight],
  )

  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        showBackButton={true}
        title="new"
        titleIcon="leaf"
        setFabOpen={setFabOpen}
      />
      <View style={[CommonStyles.listContainer, listContainerPadding]}>
        <TagList
          tagListType={TagListEnum.New}
          emptyMessage={loadingState === LoadingState.succeeded ? 'no tags found' : ''}
          listRef={listRef}
        />
      </View>
      {loadingState === LoadingState.pending ? (
        <View style={CommonStyles.spinnerHolder}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}
      <Snackbar
        visible={loadingState === LoadingState.failed}
        onDismiss={setIdle}
        onIconPress={setIdle}
      >
        {`error fetching tags: ${error}`}
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

export default NewScreen
