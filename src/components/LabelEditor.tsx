import {useAppDispatch, useAppSelector} from "@app/hooks"
import useHaptics from "@app/hooks/useHaptics"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {StackParamList} from "@app/navigation/navigationParams"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {useState} from "react"
import {Platform, StyleSheet, TouchableOpacity, View} from "react-native"
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
} from "react-native-draggable-flatlist"
import {
  Button,
  Dialog,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import Animated, {FadeIn, FadeOut} from "react-native-reanimated"
import {useSafeAreaInsets} from "react-native-safe-area-context"

const ITEM_HEIGHT = 60

export default function LabelEditor() {
  const haptics = useHaptics()
  const labels = useAppSelector(state => state.favorites.labels)
  const setLabels = (items: string[]) =>
    dispatch(FavoritesActions.setLabels(items))
  const [draftLabel, setDraftLabel] = useState("")
  const [labelToEdit, setLabelToEdit] = useState("")
  const [labelToDelete, setLabelToDelete] = useState("")
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // start editing
  const startEditing = (label: string) => {
    setDraftLabel(label)
    setLabelToEdit(label)
  }

  const stopEditing = () => setLabelToEdit("")

  const renameLabel = (label: string, newLabel: string) => {
    dispatch(FavoritesActions.renameLabel({oldLabel: label, newLabel}))
  }

  const startDeleting = (label: string) => {
    stopEditing()
    setLabelToDelete(label)
    setDeleteDialogVisible(true)
  }
  const stopDeleting = () => {
    setLabelToDelete("")
    setDeleteDialogVisible(false)
  }
  const deleteLabel = async () => {
    await haptics.selectionAsync()
    dispatch(FavoritesActions.deleteLabel(labelToDelete))
    setLabelToDelete("")
    setDeleteDialogVisible(false)
  }

  const renderItem = ({item, drag, isActive}: RenderItemParams<string>) => {
    const editingThisItem = item === labelToEdit
    return (
      <Animated.View
        pointerEvents="box-none"
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        key={item}
        style={[
          styles.itemHolder,
          {
            backgroundColor: isActive
              ? theme.colors.secondaryContainer
              : theme.colors.onSecondary,
          },
        ]}>
        <IconButton
          icon={editingThisItem ? "close" : "pencil-outline"}
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
                style={styles.itemText}
              />
              <IconButton
                icon="trash-can-outline"
                disabled={item !== draftLabel}
                onPress={() => startDeleting(item)} // TODO: confirmation
              />
            </>
          ) : (
            <>
              <Text style={styles.itemText}>{item}</Text>
              {labelToEdit ? null : (
                <TouchableOpacity onPress={() => {}} onPressIn={drag}>
                  <IconButton
                    icon="drag-vertical"
                    size={20}
                    iconColor="black"
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Animated.View>
    )
  }

  const containerStyle = {...styles.container}
  if (Platform.OS === "android") {
    containerStyle.paddingBottom += insets.bottom
  }

  return (
    <View style={containerStyle}>
      <NestableScrollContainer keyboardShouldPersistTaps="handled">
        <NestableDraggableFlatList
          keyboardShouldPersistTaps="handled"
          data={labels}
          onDragBegin={() => {
            haptics.selectionAsync()
          }}
          onDragEnd={({data}) => {
            haptics.selectionAsync()
            return setLabels(data)
          }}
          keyExtractor={item => item}
          renderItem={renderItem}
        />
      </NestableScrollContainer>
      <Dialog
        visible={deleteDialogVisible}
        onDismiss={stopDeleting}
        style={styles.dialog}>
        <Dialog.Title>delete label</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyLarge">{labelToDelete}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={stopDeleting}>cancel</Button>
          <Button onPress={deleteLabel}>ok</Button>
        </Dialog.Actions>
      </Dialog>
      {labelToDelete ? null : (
        <Button
          icon="plus"
          mode="contained-tonal"
          onPress={() => {
            stopEditing()
            navigation.navigate("CreateLabel", {})
          }}
          style={styles.createButton}>
          new label
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%",
    // Keeping separate so we can change the bottom padding
    paddingTop: 7,
    paddingRight: 7,
    paddingBottom: 7,
    paddingLeft: 7,
  },
  header: {
    height: 35,
  },
  createButton: {
    alignSelf: "flex-start",
    margin: 15,
  },
  scrollHolder: {
    flex: 1,
  },
  scrollView: {
    width: "100%",
  },
  itemHolder: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: ITEM_HEIGHT,
  },
  itemAndRightIcon: {
    flex: 1,
    flexDirection: "row",
    flexGrow: 3,
    justifyContent: "space-between",
    alignItems: "center",
    height: 30,
  },
  itemText: {
    flexGrow: 1,
    marginLeft: 5,
  },
  title: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
  },
  dialog: {
    borderRadius: 10,
  },
})
