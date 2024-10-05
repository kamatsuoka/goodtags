import homeIcon from "@app/components/homeIcon"
import {useAppDispatch, useAppSelector, useBodyInsets} from "@app/hooks"
import {receiveSharedFile, shareFavorites} from "@app/modules/favoritesSlice"
import {useState} from "react"
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native"
import DocumentPicker from "react-native-document-picker"
import {List, Portal, Snackbar, Text, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

/**
 * Data (i/o) screen
 */
export default function DataScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const {paddingLeft, paddingRight} = useBodyInsets()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(state => state.favorites)
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState("")

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft,
      paddingRight,
    },
    section: {
      paddingHorizontal: 10,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      height: 50,
      flexDirection: "row",
      paddingLeft: 5,
      paddingRight: 0,
    },
    buttonHolder: {
      paddingVertical: 10,
      paddingLeft: insets.left,
      alignItems: "flex-start",
    },
  })

  return (
    <View style={styles.container}>
      <List.Section style={styles.section}>
        <ScrollView>
          <Text variant="titleLarge">faves + labels</Text>
          <View style={styles.listHolder}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  const pickerResult = await DocumentPicker.pickSingle({
                    presentationStyle: "fullScreen",
                    copyTo: "documentDirectory",
                    // copyTo: "cachesDirectory",
                  })
                  console.log(
                    `result from DocumentPicker.pickSingle: ${pickerResult}`,
                  )
                  if (pickerResult?.copyError) {
                    console.error(
                      `error copying file: ${pickerResult.copyError}`,
                    )
                  }
                  if (pickerResult?.fileCopyUri) {
                    const importPayload = await dispatch(
                      receiveSharedFile(pickerResult.fileCopyUri),
                    )
                    const importResult = importPayload.payload
                    console.log(`importResult: ${importResult}`)
                    // if importResult is a string, it's an error message
                    if (typeof importResult === "string") {
                      setSnackBarMessage(importResult)
                      // or if it's a list of tags, just report how many were imported
                    } else if (importResult?.favorites) {
                      setSnackBarMessage(
                        `imported ${importResult.favorites.length} tags` +
                          ` and ${importResult.receivedLabels.length} labels`,
                      )
                    } else {
                      setSnackBarMessage("import failed")
                    }
                    setSnackBarVisible(true)
                  }
                } catch (e) {
                  if (DocumentPicker.isCancel(e)) {
                    console.log("document picker cancelled")
                  } else {
                    console.error(JSON.stringify(e))
                    setSnackBarMessage(`import error: ${e}`)
                    setSnackBarVisible(true)
                  }
                }
              }}>
              <List.Item
                title="import"
                left={ImportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareFavorites(favorites)}>
              <List.Item
                title="export"
                left={ExportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </List.Section>
      <Portal>
        <Snackbar
          visible={snackBarVisible}
          onDismiss={() => setSnackBarVisible(false)}
          action={{
            label: "close",
          }}>
          {snackBarMessage}
        </Snackbar>
      </Portal>
    </View>
  )
}

const RightIcon = homeIcon("chevron-right")
const ExportIcon = homeIcon("database-export")
const ImportIcon = homeIcon("database-import")
