import homeIcon from '@app/components/homeIcon'
import {
  clearPdfCache,
  useAppDispatch,
  useAppSelector,
  useBodyInsets,
} from '@app/hooks'
import { receiveSharedFile, shareFavorites } from '@app/modules/favoritesSlice'
import {
  errorCodes,
  isErrorWithCode,
  pick as pickDocument,
  types,
} from '@react-native-documents/picker'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import {
  Divider,
  List,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Data (i/o) screen
 */
export default function DataScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(state => state.favorites)
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')
  const [clearingCache, setClearingCache] = useState(false)
  const { width, height } = useWindowDimensions()
  const isLandscape = width > height

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: Math.max(paddingLeft, 20),
      paddingRight: Math.max(paddingRight, 20),
      paddingTop: 10,
    },
    section: {
      paddingHorizontal: 10,
      width: '100%',
    },
    title: {
      marginTop: isLandscape ? 0 : 10,
      marginBottom: 10,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 0,
    },
    listItem: {
      height: 50,
      flexDirection: 'row',
      paddingLeft: 5,
      paddingRight: 0,
      marginVertical: 10,
    },
    buttonHolder: {
      paddingVertical: 10,
      paddingLeft: insets.left,
      alignItems: 'flex-start',
    },
    columnsContainer: {
      flexDirection: isLandscape ? 'row' : 'column',
      width: '100%',
    },
    column: {
      flex: isLandscape ? 1 : undefined,
      width: isLandscape ? undefined : '100%',
      paddingHorizontal: isLandscape ? 5 : 0,
      marginHorizontal: isLandscape ? 10 : 0,
      marginVertical: 20,
    },
  })

  return (
    <View style={styles.container}>
      <ScrollView style={styles.section}>
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              faves + labels
            </Text>
            <View style={styles.listHolder}>
              <TouchableOpacity onPress={() => shareFavorites(favorites)}>
                <List.Item
                  title="backup"
                  left={ExportIcon}
                  right={RightIcon}
                  style={styles.listItem}
                />
              </TouchableOpacity>
              <Divider />
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
                      try {
                        const importPayload = await dispatch(
                          receiveSharedFile(pickerResult.uri),
                        )
                        const importResult = importPayload.payload
                        console.log(`importResult:`, importResult)
                        if (importPayload.type.endsWith('/rejected')) {
                          // Handle rejection
                          const errorMessage =
                            typeof importResult === 'string'
                              ? importResult
                              : 'import failed'
                          setSnackBarMessage(errorMessage)
                        } else if (typeof importResult === 'string') {
                          setSnackBarMessage(importResult)
                        } else if (importResult?.favorites) {
                          const favCount = importResult.favorites.length
                          const labelCount = importResult.receivedLabels.length
                          setSnackBarMessage(
                            `imported ${favCount} tag${
                              favCount !== 1 ? 's' : ''
                            }` +
                              ` and ${labelCount} label${
                                labelCount !== 1 ? 's' : ''
                              }`,
                          )
                        } else {
                          setSnackBarMessage('import failed')
                        }
                      } catch (parseError) {
                        console.error('Parse error:', parseError)
                        setSnackBarMessage('invalid file format')
                      }
                      setSnackBarVisible(true)
                    }
                  } catch (e) {
                    if (
                      isErrorWithCode(e) &&
                      e.code === errorCodes.OPERATION_CANCELED
                    ) {
                      console.log('document picker canceled')
                    } else {
                      console.error(JSON.stringify(e))
                      setSnackBarMessage(`import error: ${e}`)
                      setSnackBarVisible(true)
                    }
                  }
                }}
              >
                <List.Item
                  title="restore"
                  left={ImportIcon}
                  right={RightIcon}
                  style={styles.listItem}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              pdf cache
            </Text>
            <View style={styles.listHolder}>
              <TouchableOpacity
                onPress={async () => {
                  setClearingCache(true)
                  try {
                    await clearPdfCache()
                    setSnackBarMessage('pdf cache cleared')
                  } catch (error) {
                    console.error('Failed to clear pdf cache:', error)
                    setSnackBarMessage(
                      `Error clearing cache: ${
                        error instanceof Error ? error.message : 'Unknown error'
                      }`,
                    )
                  } finally {
                    setClearingCache(false)
                    setSnackBarVisible(true)
                  }
                }}
                disabled={clearingCache}
              >
                <List.Item
                  title="clear cache"
                  left={ClearIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  disabled={clearingCache}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              logs
            </Text>
            <View style={styles.listHolder}>
              <TouchableOpacity
                onPress={async () => {
                  navigation.navigate('Logs')
                }}
              >
                <List.Item
                  title="view logs"
                  left={LogsIcon}
                  right={RightIcon}
                  style={styles.listItem}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
const ClearIcon = homeIcon('broom')
const LogsIcon = homeIcon('file-document-multiple-outline')
