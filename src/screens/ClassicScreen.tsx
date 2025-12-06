import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import {
  AppDispatch,
  useAppDispatch,
  useAppSelector,
  useBodyInsets,
  useFabDownStyle,
} from '@app/hooks'
import {
  ClassicActions,
  getClassicTags,
  selectClassic,
} from '@app/modules/classicSlice'
import {
  LoadingState,
  SORT_ICONS,
  SORT_LABELS,
  TagListEnum,
} from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { ActivityIndicator, Snackbar, useTheme } from 'react-native-paper'

/**
 * Classic tags
 */
const ClassicScreen = () => {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const dispatch: AppDispatch = useAppDispatch()
  const theme = useTheme()
  const loadingState = useAppSelector(
    state => selectClassic(state).loadingState,
  )
  const error = useAppSelector(state => selectClassic(state).error)
  const sortOrder = useAppSelector(state => selectClassic(state).sortOrder)
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
    dispatch(getClassicTags(false))
  }, [dispatch])

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.id : SortOrder.alpha

  const fabActions = useMemo(
    () => [
      {
        icon: SORT_ICONS[otherOrder],
        label: SORT_LABELS[otherOrder],
        onPress: async () => {
          return dispatch(ClassicActions.toggleSortOrder())
        },
      },
      {
        icon: 'reload',
        label: 'reload classic tags',
        onPress: async () => {
          return dispatch(getClassicTags(true))
        },
      },
      {
        icon: 'broom',
        label: 'clear classic tags',
        onPress: async () => {
          return dispatch(ClassicActions.reset())
        },
      },
    ],
    [otherOrder, dispatch],
  )

  const setIdle = useCallback(
    () => dispatch(ClassicActions.setLoadingState(LoadingState.idle)),
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
        title="classic"
        titleIcon="pillar"
        setFabOpen={setFabOpen}
      />
      <View style={[CommonStyles.listContainer, listContainerPadding]}>
        <TagList
          tagListType={TagListEnum.Classic}
          emptyMessage={
            loadingState === LoadingState.succeeded ? 'no tags found' : ''
          }
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
        color={theme.colors.onPrimary}
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

export default ClassicScreen
