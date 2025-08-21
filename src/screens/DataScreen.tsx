import homeIcon from '@app/components/homeIcon'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { restoreFromBackup, shareBackup } from '@app/modules/dataMigration'
import { receiveSharedFile, shareFavorites } from '@app/modules/favoritesSlice'
import {
  errorCodes,
  isErrorWithCode,
  pick as pickDocument,
  types,
} from '@react-native-documents/picker'
import { useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { List, Portal, Snackbar, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Data (i/o) screen
 */
export default function DataScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(state => state.favorites)
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft,
      paddingRight,
    },
    section: {
      paddingHorizontal: 10,
    },
    sectionTitle: {
      marginTop: 20,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      height: 50,
      flexDirection: 'row',
      paddingLeft: 5,
      paddingRight: 0,
    },
    buttonHolder: {
      paddingVertical: 10,
      paddingLeft: insets.left,
      alignItems: 'flex-start',
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
                  const pickerResults = await pickDocument({
                    presentationStyle: 'fullScreen',
                    mode: 'import',
                    type: [types.json, types.allFiles],
                  })
                  const pickerResult = pickerResults[0] // Get first file
                  console.log(`result from pickDocument: ${pickerResult}`)
                  if (pickerResult?.error) {
                    console.error(`error with file: ${pickerResult.error}`)
                  }
                  if (pickerResult?.uri) {
                    // Check if this is a full backup file or just favorites
                    const fs = ReactNativeBlobUtil.fs
                    const fileContent = await fs.readFile(
                      pickerResult.uri,
                      'utf8',
                    )

                    try {
                      const parsedContent = JSON.parse(fileContent)

                      // Check if this is a full app backup
                      if (parsedContent.version && parsedContent.reduxState) {
                        const restored = await restoreFromBackup(fileContent)
                        if (restored) {
                          setSnackBarMessage(
                            'App data restored successfully! Please restart the app.',
                          )
                        } else {
                          setSnackBarMessage('Restore cancelled or failed')
                        }
                      } else {
                        // Handle as legacy favorites import
                        const importPayload = await dispatch(
                          receiveSharedFile(pickerResult.uri),
                        )
                        const importResult = importPayload.payload
                        console.log(`importResult: ${importResult}`)
                        if (typeof importResult === 'string') {
                          setSnackBarMessage(importResult)
                        } else if (importResult?.favorites) {
                          setSnackBarMessage(
                            `imported ${importResult.favorites.length} tags` +
                              ` and ${importResult.receivedLabels.length} labels`,
                          )
                        } else {
                          setSnackBarMessage('import failed')
                        }
                      }
                    } catch (parseError) {
                      setSnackBarMessage('Invalid file format')
                    }
                    setSnackBarVisible(true)
                  }
                } catch (e) {
                  if (
                    isErrorWithCode(e) &&
                    e.code === errorCodes.OPERATION_CANCELED
                  ) {
                    console.log('document picker cancelled')
                  } else {
                    console.error(JSON.stringify(e))
                    setSnackBarMessage(`import error: ${e}`)
                    setSnackBarVisible(true)
                  }
                }
              }}
            >
              <List.Item
                title="import data"
                description="Import favorites, labels, or full app backup"
                left={ImportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareFavorites(favorites)}>
              <List.Item
                title="export favorites"
                description="Export just favorites and labels"
                left={ExportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
          </View>

          <Text variant="titleLarge" style={styles.sectionTitle}>
            full app backup
          </Text>
          <View style={styles.listHolder}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await shareBackup()
                  setSnackBarMessage('Backup created and shared successfully!')
                  setSnackBarVisible(true)
                } catch (error) {
                  setSnackBarMessage('Failed to create backup')
                  setSnackBarVisible(true)
                }
              }}
            >
              <List.Item
                title="create full backup"
                description="Backup all app data for device migration"
                left={BackupIcon}
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
            label: 'close',
          }}
        >
          {snackBarMessage}
        </Snackbar>
      </Portal>
    </View>
  )
}

const RightIcon = homeIcon('chevron-right')
const ExportIcon = homeIcon('database-export')
const ImportIcon = homeIcon('database-import')
const BackupIcon = homeIcon('backup-restore')
