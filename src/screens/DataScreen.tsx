import homeIcon from '@app/components/homeIcon'
import {
  clearPdfCache,
  useAppSelector,
  useBodyInsets,
  useDataImport,
  useWindowShape,
} from '@app/hooks'
import { useListStyles } from '@app/hooks/useListStyles'
import { shareFavorites } from '@app/modules/favoritesSlice'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Divider, List, Portal, Snackbar, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Data (i/o) screen
 */
export default function DataScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const favorites = useAppSelector(state => state.favorites)
  const { handleImport } = useDataImport()
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')
  const [clearingCache, setClearingCache] = useState(false)
  const { landscape } = useWindowShape()
  const { listStyles, pressableStyle } = useListStyles()

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
      marginTop: landscape ? 0 : 10,
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
      flexDirection: landscape ? 'row' : 'column',
      width: '100%',
    },
    column: {
      flex: landscape ? 1 : undefined,
      width: landscape ? undefined : '100%',
      paddingHorizontal: landscape ? 5 : 0,
      marginHorizontal: landscape ? 10 : 0,
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
            <View style={listStyles.listHolder}>
              <Pressable
                onPress={async () => {
                  const { message, showSnackBar } = await shareFavorites(favorites)
                  if (showSnackBar) {
                    setSnackBarMessage(message)
                    setSnackBarVisible(true)
                  }
                }}
                style={pressableStyle}
              >
                <List.Item
                  title="backup"
                  left={ExportIcon}
                  right={RightIcon}
                  style={listStyles.listItem}
                  titleStyle={theme.fonts.bodyLarge}
                />
              </Pressable>
              <Divider />
              <Pressable
                style={pressableStyle}
                onPress={async () => {
                  const { message, showSnackBar } = await handleImport()
                  if (showSnackBar) {
                    setSnackBarMessage(message)
                    setSnackBarVisible(true)
                  }
                }}
              >
                <List.Item
                  title="restore"
                  left={ImportIcon}
                  right={RightIcon}
                  style={listStyles.listItem}
                  titleStyle={theme.fonts.bodyLarge}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              pdf cache
            </Text>
            <View style={listStyles.listHolder}>
              <Pressable
                style={pressableStyle}
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
                  style={listStyles.listItem}
                  titleStyle={theme.fonts.bodyLarge}
                  disabled={clearingCache}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              logs
            </Text>
            <View style={listStyles.listHolder}>
              <Pressable
                style={pressableStyle}
                onPress={async () => {
                  navigation.navigate('Logs')
                }}
              >
                <List.Item
                  title="view logs"
                  left={LogsIcon}
                  right={RightIcon}
                  style={listStyles.listItem}
                  titleStyle={theme.fonts.bodyLarge}
                />
              </Pressable>
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
