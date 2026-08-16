import homeIcon from '@app/components/homeIcon'
import { MAX_FONT_SIZE_MULTIPLIER, Text } from '@app/components/Text'
import {
  clearPdfCache,
  useAppSelector,
  useBodyInsets,
  useDataImport,
  useWindowShape,
} from '@app/hooks'
import { useListStyles } from '@app/hooks/useListStyles'
import { shareFavorites } from '@app/modules/favoritesSlice'
import { DbUpdateResult, refreshDbNow } from '@app/modules/sqlUtil'
import { useNavigation } from '@react-navigation/native'
import { ComponentProps, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Divider, List, Portal, Snackbar, useTheme } from 'react-native-paper'
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
  const [refreshingDb, setRefreshingDb] = useState(false)
  const { landscape } = useWindowShape()
  const { listStyles } = useListStyles()

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
      marginVertical: 10,
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
              <DataRow
                title="backup"
                icon={ExportIcon}
                testID="backup"
                onPress={async () => {
                  const { message, showSnackBar } = await shareFavorites(favorites)
                  if (showSnackBar) {
                    setSnackBarMessage(message)
                    setSnackBarVisible(true)
                  }
                }}
              />
              <Divider />
              <DataRow
                title="restore"
                icon={ImportIcon}
                testID="restore"
                onPress={async () => {
                  const { message, showSnackBar } = await handleImport()
                  if (showSnackBar) {
                    setSnackBarMessage(message)
                    setSnackBarVisible(true)
                  }
                }}
              />
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              search database
            </Text>
            <View style={listStyles.listHolder}>
              <DataRow
                title="refresh"
                icon={RefreshIcon}
                testID="refresh_db"
                disabled={refreshingDb}
                onPress={async () => {
                  setRefreshingDb(true)
                  try {
                    // Force: always re-download and re-adopt, so this also recovers a
                    // stale or corrupted local DB (not just "update if newer").
                    const result = await refreshDbNow(true)
                    setSnackBarMessage(REFRESH_DB_MESSAGES[result])
                  } finally {
                    setRefreshingDb(false)
                    setSnackBarVisible(true)
                  }
                }}
              />
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              pdf cache
            </Text>
            <View style={listStyles.listHolder}>
              <DataRow
                title="clear cache"
                icon={ClearIcon}
                disabled={clearingCache}
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
              />
            </View>
          </View>

          <View style={styles.column}>
            <Text variant="titleLarge" style={styles.title}>
              logs
            </Text>
            <View style={listStyles.listHolder}>
              <DataRow
                title="view logs"
                icon={LogsIcon}
                onPress={() => navigation.navigate('Logs')}
              />
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
            testID: 'close_button',
          }}
        >
          {snackBarMessage}
        </Snackbar>
      </Portal>
    </View>
  )
}

const REFRESH_DB_MESSAGES: Record<DbUpdateResult, string> = {
  [DbUpdateResult.Updated]: 'search database refreshed',
  // True whichever branch produced it -- "remote isn't newer" or "remote has nothing for
  // this app's schema version". Both mean the user already has the newest DB they can
  // get, so the wording deliberately doesn't depend on which one it was.
  [DbUpdateResult.UpToDate]: 'search database already up to date',
  // Covers both remaining causes: the download failed, or what came back wasn't a
  // usable DB. Deliberately not phrased as a network error -- a corrupt download
  // reaches the server just fine.
  [DbUpdateResult.Unavailable]: "couldn't download a usable search database",
}

/**
 * A tappable row in one of this screen's lists. Every row on the screen carries the same
 * six presentation props; naming them once here keeps a styling change to one edit
 * instead of one per action.
 */
function DataRow(props: {
  title: string
  icon: ComponentProps<typeof List.Item>['left']
  onPress: () => void
  disabled?: boolean
  testID?: string
}) {
  const { title, icon, onPress, disabled, testID } = props
  const theme = useTheme()
  const { listStyles, pressableStyle } = useListStyles()

  return (
    <Pressable style={pressableStyle} onPress={onPress} disabled={disabled}>
      <List.Item
        title={title}
        left={icon}
        right={RightIcon}
        style={listStyles.listItem}
        titleStyle={theme.fonts.bodyLarge}
        titleMaxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        disabled={disabled}
        testID={testID}
      />
    </Pressable>
  )
}

const RightIcon = homeIcon('chevron-right')
const ExportIcon = homeIcon('database-export')
const ImportIcon = homeIcon('database-import')
const ClearIcon = homeIcon('broom')
const RefreshIcon = homeIcon('database-refresh')
const LogsIcon = homeIcon('file-document-multiple-outline')
