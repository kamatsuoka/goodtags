import { useFocusEffect } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import { FABDown } from '../components/FABDown'
import ListHeader from '../components/ListHeader'
import TagList from '../components/TagList'
import CommonStyles from '../constants/CommonStyles'
import { SortOrder } from '../constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '../hooks'
import useFabDownStyle from '../hooks/useFabDownStyle'
import { HistoryActions } from '../modules/historySlice'
import { SORT_ICONS, SORT_LABELS, TagListEnum } from '../modules/tagLists'

/**
 * Recently viewed tags.
 */
const HistoryScreen = () => {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.history.sortOrder)
  const lastModified = useAppSelector(state => state.history.lastModified)
  const dispatch = useAppDispatch()
  const listRef = useRef<FlashList<number>>(null)
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

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: SORT_LABELS[otherOrder],
      onPress: async () => {
        dispatch(HistoryActions.toggleSortOrder())
      },
    },
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
      <ListHeader listRef={listRef} title="history" titleIcon="history" />
      <View style={styles.listContainer}>
        <TagList
          listRef={listRef}
          title="History"
          emptyMessage="Tags you have viewed will show up here"
          tagListType={TagListEnum.History}
        />
      </View>
      <FABDown
        icon={fabOpen ? 'minus' : 'cog-outline'}
        open={fabOpen}
        actions={fabActions}
        onStateChange={({ open }) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        theme={useTheme()}
      />
    </View>
  )
}

export default HistoryScreen
