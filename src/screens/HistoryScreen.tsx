import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { HistoryActions } from '@app/modules/historySlice'
import { SORT_ICONS, SORT_LABELS, TagListEnum } from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

/**
 * Recently viewed tags.
 */
const HistoryScreen = () => {
  const theme = useTheme()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.history.sortOrder)
  const lastModified = useAppSelector(state => state.history.lastModified)
  const dispatch = useAppDispatch()
  const listRef = useRef<FlashListRef<number> | null>(null)
  const fabStyleSheet = useFabDownStyle()

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  useFocusEffect(
    useCallback(() => {
      dispatch(HistoryActions.incorporateHistory())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, lastModified]),
  )

  const sortOptions = [SortOrder.alpha, SortOrder.newest, SortOrder.id]
  const otherOrders = sortOptions.filter(order => order !== sortOrder)

  const fabActions = [
    ...otherOrders.map(order => ({
      icon: SORT_ICONS[order],
      label: SORT_LABELS[order],
      onPress: async () => {
        dispatch(HistoryActions.setSortOrder(order))
      },
    })),
    {
      icon: 'broom',
      label: 'clear history',
      onPress: async () => {
        dispatch(HistoryActions.clearHistory())
      },
    },
  ]

  const styles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        showBackButton={false}
        title="history"
        titleIcon="history"
        setFabOpen={setFabOpen}
      />
      <View style={styles.listContainer}>
        <TagList
          listRef={listRef}
          emptyMessage="Tags you have viewed will show up here"
          tagListType={TagListEnum.History}
        />
      </View>
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

export default HistoryScreen
