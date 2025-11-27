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
import { SORT_ICONS, TagListEnum } from '../modules/tagLists'

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

  const otherOrder =
    sortOrder === SortOrder.alpha ? SortOrder.newest : SortOrder.alpha

  const iconLabel =
    sortOrder === SortOrder.newest
      ? 'sort alphabetically'
      : 'sort by recently added'

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        dispatch(FavoritesActions.toggleSortOrder())
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

  const emptyMessage = 'tap the heart icon in sheet music to add favorites'
  return (
    <View style={CommonStyles.container}>
      <ListHeader listRef={listRef} title="faves" titleIcon="heart-outline" />
      <View style={styles.listContainer}>
        <TagList
          listRef={listRef}
          emptyMessage={emptyMessage}
          tagListType={TagListEnum.Favorites}
        />
      </View>
      <FABDown
        icon={fabOpen ? 'minus' : 'cog-outline'}
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
