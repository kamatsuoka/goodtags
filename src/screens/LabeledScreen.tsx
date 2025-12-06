import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { SORT_ICONS } from '@app/modules/tagLists'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from 'react-native-paper'

/**
 * Lists of labeled tags
 */
export const LabeledScreen = () => {
  const theme = useTheme()
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
  const otherOrder = order === SortOrder.alpha ? SortOrder.id : SortOrder.alpha

  const iconLabel =
    order === SortOrder.id ? 'sort alphabetically' : 'sort by id'

  const fabActions = [
    {
      icon: SORT_ICONS[otherOrder],
      label: iconLabel,
      onPress: async () => {
        dispatch(FavoritesActions.toggleLabeledSortOrder())
      },
    },
  ]

  const listContainerPadding = useMemo(
    () => ({
      paddingLeft,
      paddingRight,
    }),
    [paddingLeft, paddingRight],
  )

  const emptyMessage = 'no tags with this label yet'
  return (
    <View style={CommonStyles.container}>
      <ListHeader
        listRef={listRef}
        title={selectedLabel}
        titleIcon="tag-outline"
        showBackButton={true}
        setFabOpen={setFabOpen}
      />
      <View style={[CommonStyles.listContainer, listContainerPadding]}>
        <TagList
          listRef={listRef}
          emptyMessage={emptyMessage}
          tagListType={selectedLabel || ''}
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
