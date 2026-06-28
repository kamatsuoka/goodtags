import { FABDown } from '@app/components/FABDown'
import ListHeader from '@app/components/ListHeader'
import TagList from '@app/components/TagList'
import { Text } from '@app/components/Text'
import CommonStyles from '@app/constants/CommonStyles'
import { SortOrder } from '@app/constants/Search'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { SORT_ICONS, SORT_LABELS, TagListEnum } from '@app/modules/tagLists'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { FlashListRef } from '@shopify/flash-list'
import { useCallback, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Divider, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Favorites list
 */
export const FavoritesScreen = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [fabOpen, setFabOpen] = useState(false)
  const sortOrder = useAppSelector(state => state.favorites.sortOrder)
  const dispatch = useAppDispatch()
  const listRef = useRef<FlashListRef<number> | null>(null)
  const fabStyleSheet = useFabDownStyle()
  const confirmSheetRef = useRef<BottomSheetModal>(null)

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFabOpen(false)
      }
    }, []),
  )

  const sortOptions = [SortOrder.alpha, SortOrder.newest, SortOrder.id]
  const otherOrders = sortOptions.filter(order => order !== sortOrder)

  const confirmRemoveAll = () => {
    confirmSheetRef.current?.present()
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  )

  const fabActions = [
    ...otherOrders.map(order => ({
      icon: SORT_ICONS[order],
      label: SORT_LABELS[order],
      onPress: async () => {
        dispatch(FavoritesActions.setSortOrder(order))
      },
      testID: SORT_LABELS[order],
    })),
    {
      icon: 'broom',
      label: 'remove all favorites',
      onPress: async () => confirmRemoveAll(),
      testID: 'remove-all',
    },
  ]

  const styles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  const sheetStyles = StyleSheet.create({
    container: {
      paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24),
      paddingTop: 8,
    },
    title: {
      textAlign: 'center',
      paddingVertical: 12,
    },
    action: {
      alignItems: 'center',
      paddingVertical: 18,
    },
  })

  const emptyMessage = 'to add favorites,\ntap the heart icon in sheet music'
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
      <BottomSheetModal
        ref={confirmSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView
          style={[sheetStyles.container, { paddingBottom: Math.max(24, insets.bottom) }]}
        >
          <Pressable
            onPress={() => {
              confirmSheetRef.current?.dismiss()
              dispatch(FavoritesActions.resetFavoriteTags())
            }}
            style={sheetStyles.action}
            testID="remove_favorites_confirm"
          >
            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
              remove all favorites
            </Text>
          </Pressable>
          <Divider />
          <Pressable onPress={() => confirmSheetRef.current?.dismiss()} style={sheetStyles.action}>
            <Text variant="bodyLarge">cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
}
