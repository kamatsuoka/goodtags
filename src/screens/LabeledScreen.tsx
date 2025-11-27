import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
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
import { FavoritesActions } from '../modules/favoritesSlice'
import { SORT_ICONS } from '../modules/tagLists'

/**
 * Lists of labeled tags
 */
export const LabeledScreen = () => {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const labeledSortOrder = useAppSelector(
    state => state.favorites.labeledSortOrder,
  )
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

  const order = labeledSortOrder
  const otherOrder =
    order === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const iconLabel =
    order === SortOrder.newest ? 'sort alphabetically' : 'sort by id'

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        dispatch(FavoritesActions.toggleLabeledSortOrder())
      },
    },
  ]

  const themedStyles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  const emptyMessage = 'no tags with this label yet'
  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        title={selectedLabel}
        titleIcon="tag-outline"
        showBackButton={true}
      />
      <View style={themedStyles.listContainer}>
        <TagList
          listRef={listRef}
          title="tag-outline"
          emptyMessage={emptyMessage}
          tagListType={selectedLabel || ''}
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
