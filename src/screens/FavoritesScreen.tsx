import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { SORT_ICONS, SORT_LABELS, TagListEnum } from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

/**
 * Favorites list
 */
export const FavoritesScreen = () => {
  const theme = useTheme()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.favorites.sortOrder)
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

  const sortOptions = [SortOrder.alpha, SortOrder.newest, SortOrder.id]
  const otherOrders = sortOptions.filter(order => order !== sortOrder)

  const fabActions = otherOrders.map(order => ({
    icon: SORT_ICONS[order],
    label: SORT_LABELS[order],
    onPress: async () => {
      dispatch(FavoritesActions.setSortOrder(order))
    },
  }))

  const styles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  const emptyMessage = 'tap the heart icon in sheet music to add favorites'
  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        title="faves"
        titleIcon="heart-outline"
        setFabOpen={setFabOpen}
      />
      <View style={styles.listContainer}>
        <TagList
          listRef={listRef}
          emptyMessage={emptyMessage}
          tagListType={TagListEnum.Favorites}
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
