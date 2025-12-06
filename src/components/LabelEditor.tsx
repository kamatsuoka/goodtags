import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { useMemo, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import { IconButton, Text, TextInput, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ITEM_HEIGHT = 60

export default function LabelEditor() {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  const setLabels = (items: string[]) =>
    dispatch(FavoritesActions.setLabels(items))
  const [draftLabel, setDraftLabel] = useState('')
  const [labelToEdit, setLabelToEdit] = useState('')
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const containerPadding = useMemo(
    () => ({
      paddingLeft,
      paddingRight,
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

  const confirmDelete = (label: string) => {
    stopEditing()
    Alert.alert(
      'delete label?',
      label,
      [
        {
          text: 'cancel',
          style: 'cancel',
        },
        {
          text: 'delete',
          style: 'destructive',
          onPress: () => dispatch(FavoritesActions.deleteLabel(label)),
        },
      ],
      { cancelable: true },
    )
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
            backgroundColor: isActive
              ? theme.colors.secondaryContainer
              : theme.colors.onSecondary,
          },
        ]}
      >
        <IconButton
          icon={editingThisItem ? 'close' : 'pencil-outline'}
          animated
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
                  newLabel &&
                    newLabel !== labelToEdit &&
                    renameLabel(item, newLabel)
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
              />
            </>
          ) : (
            <>
              <Text
                style={[styles.itemText, theme.fonts.bodyLarge]}
                variant="bodyLarge"
              >
                {item}
              </Text>
              {labelToEdit ? null : (
                <Pressable onPress={() => {}} onPressIn={drag}>
                  <IconButton
                    icon="drag-vertical"
                    size={20}
                    iconColor="black"
                  />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, containerPadding]}>
      <NestableScrollContainer keyboardShouldPersistTaps="handled">
        <NestableDraggableFlatList
          keyboardShouldPersistTaps="handled"
          data={labels}
          onDragEnd={({ data }) => {
            return setLabels(data)
          }}
          keyExtractor={item => item}
          renderItem={renderItem}
        />
      </NestableScrollContainer>
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
