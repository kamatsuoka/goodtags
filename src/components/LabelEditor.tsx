import { Text } from '@app/components/Text'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { Divider, IconButton, TextInput, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ITEM_HEIGHT = 60

export default function LabelEditor() {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  const setLabels = (items: string[]) => dispatch(FavoritesActions.setLabels(items))
  const [draftLabel, setDraftLabel] = useState('')
  const [labelToEdit, setLabelToEdit] = useState('')
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const confirmSheetRef = useRef<BottomSheetModal>(null)
  const [labelToDelete, setLabelToDelete] = useState('')

  const containerPadding = useMemo(
    () => ({
      paddingLeft: paddingLeft + 15,
      paddingRight: paddingRight + 10,
      paddingBottom: Platform.OS === 'android' ? 7 + insets.bottom : 7,
    }),
    [paddingLeft, paddingRight, insets.bottom],
  )

  // start editing
  const startEditing = (label: string) => {
    setDraftLabel(label)
    setLabelToEdit(label)
  }

  const stopEditing = () => setLabelToEdit('')

  const renameLabel = (label: string, newLabel: string) => {
    dispatch(FavoritesActions.renameLabel({ oldLabel: label, newLabel }))
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

  const confirmDelete = (label: string) => {
    stopEditing()
    setLabelToDelete(label)
    confirmSheetRef.current?.present()
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => {
    const editingThisItem = item === labelToEdit
    return (
      <View
        pointerEvents="box-none"
        key={item}
        style={[
          styles.itemHolder,
          {
            backgroundColor: isActive ? theme.colors.secondaryContainer : theme.colors.onSecondary,
          },
        ]}
      >
        <IconButton
          icon={editingThisItem ? 'close' : 'pencil-outline'}
          animated
          testID={`label_pencil_${item}`}
          onPress={() => (editingThisItem ? stopEditing() : startEditing(item))}
        />
        <View style={styles.itemAndRightIcon}>
          {editingThisItem ? (
            <>
              <TextInput
                value={draftLabel}
                mode="flat"
                autoFocus
                autoCapitalize="none"
                onChangeText={(newLabel: string) => setDraftLabel(newLabel)}
                onSubmitEditing={() => {
                  const newLabel = draftLabel.trim()
                  newLabel && newLabel !== labelToEdit && renameLabel(item, newLabel)
                  stopEditing()
                }}
                maxLength={32}
                dense
                style={[styles.itemText, theme.fonts.bodyLarge]}
              />
              <IconButton
                icon="trash-can-outline"
                disabled={item !== draftLabel}
                onPress={() => confirmDelete(item)}
                testID={`label_trash_${item}`}
              />
            </>
          ) : (
            <>
              <Text style={[styles.itemText, theme.fonts.bodyLarge]} variant="bodyLarge">
                {item}
              </Text>
              {labelToEdit ? null : (
                <Pressable onPress={() => {}} onPressIn={drag}>
                  <IconButton
                    icon="drag-vertical"
                    size={20}
                    iconColor="black"
                    testID={`label_drag_${item}`}
                  />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    )
  }

  const sheetStyles = StyleSheet.create({
    container: {
      paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24),
      paddingTop: 8,
    },
    action: {
      alignItems: 'center',
      paddingVertical: 18,
    },
  })

  return (
    <View style={[styles.container, containerPadding]}>
      <DraggableFlatList
        keyboardShouldPersistTaps="handled"
        data={labels}
        onDragEnd={({ data }) => setLabels(data)}
        keyExtractor={item => item}
        renderItem={renderItem}
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
              dispatch(FavoritesActions.deleteLabel(labelToDelete))
            }}
            style={sheetStyles.action}
            testID="delete_label_confirm"
          >
            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
              delete label
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: 7,
  },
  header: {
    height: 35,
  },
  createButton: {
    alignSelf: 'flex-start',
    margin: 15,
  },
  scrollHolder: {
    flex: 1,
  },
  scrollView: {
    width: '100%',
  },
  itemHolder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: ITEM_HEIGHT,
  },
  itemAndRightIcon: {
    flex: 1,
    flexDirection: 'row',
    flexGrow: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  itemText: {
    flexGrow: 1,
    marginLeft: 5,
  },
})
