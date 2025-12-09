import SharedHeader, { BackType } from '@app/components/SharedHeader'
import { useBodyInsets } from '@app/hooks'
import { useNavigation } from '@react-navigation/native'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Card, Chip, IconButton, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LogEntry {
  id: string
  timestamp: Date
  type: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  args: any[]
}

const MAX_LOGS = 25

// global log storage
const logStorage: LogEntry[] = []
let logIdCounter = 0

// store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
}

// intercept console methods
const interceptConsole = () => {
  const createInterceptor = (type: LogEntry['type']) => {
    return (...args: any[]) => {
      // call original method
      originalConsole[type](...args)

      const entry: LogEntry = {
        id: `log-${logIdCounter++}`,
        timestamp: new Date(),
        type,
        message: args.map(arg => String(arg)).join(' '),
        args,
      }

      logStorage.push(entry)

      // keep only last MAX_LOGS entries
      if (logStorage.length > MAX_LOGS) {
        logStorage.shift()
      }
    }
  }

  console.log = createInterceptor('log')
  console.warn = createInterceptor('warn')
  console.error = createInterceptor('error')
  console.info = createInterceptor('info')
  console.debug = createInterceptor('debug')
}

// initialize console interception
interceptConsole()

const DeleteButton = ({
  onPress,
  onLongPress,
  color,
}: {
  onPress: () => void
  onLongPress?: () => void
  color: string
}) => (
  <IconButton
    icon="delete"
    iconColor={color}
    onPress={onPress}
    onLongPress={onLongPress}
  />
)

/**
 * Screen displaying the last 100 console logs
 */
export default function LogsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [logs, setLogs] = useState<LogEntry[]>([...logStorage])
  const listRef = useRef<FlashListRef<LogEntry>>(null)
  const navigation = useNavigation()

  const handleClearLogs = useCallback(() => {
    logStorage.length = 0
    setLogs([])
  }, [])

  const generateDummyLogs = useCallback(() => {
    if (__DEV__) {
      const types: LogEntry['type'][] = ['log', 'warn', 'info', 'debug']
      const messages = [
        'Fetching user data',
        'Network request completed',
        'Cache miss',
        'Processing response',
        'Updating state',
        'Rendering component',
        'API call failed',
        'Retrying request',
        'Connection timeout',
        'Invalid parameter',
      ]

      for (let i = 0; i < 20; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const message = messages[Math.floor(Math.random() * messages.length)]
        console[type](`[Test ${i + 1}] ${message}`)
      }

      // Update the local state to reflect the new logs
      setLogs([...logStorage])
    }
  }, [])

  const renderHeaderRight = useCallback(
    () => (
      <View style={styles.headerButtons}>
        <DeleteButton
          onPress={handleClearLogs}
          onLongPress={generateDummyLogs}
          color={theme.colors.onPrimary}
        />
      </View>
    ),
    [handleClearLogs, generateDummyLogs, theme.colors.onPrimary],
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return theme.colors.error
      case 'warn':
        return theme.colors.tertiary
      case 'info':
        return theme.colors.primary
      case 'debug':
        return theme.colors.secondary
      default:
        return theme.colors.onSurface
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <Card
      style={[styles.logCard, { backgroundColor: theme.colors.surfaceVariant }]}
    >
      <Card.Content style={styles.logContent}>
        <View style={styles.logHeader}>
          <Chip
            style={[
              styles.typeChip,
              { backgroundColor: getLogColor(item.type) },
            ]}
            textStyle={[styles.typeChipText, { color: theme.colors.onPrimary }]}
          >
            {item.type.toUpperCase()}
          </Chip>
          <Text
            style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
        <Text style={[styles.logMessage, { color: theme.colors.onSurface }]}>
          {item.message}
        </Text>
      </Card.Content>
    </Card>
  )

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <SharedHeader
        title="logs"
        backType={BackType.Back}
        onBack={() => navigation.goBack()}
        headerRight={renderHeaderRight}
        listRef={listRef}
        enableScrollToTop={true}
      />
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: Math.max(paddingLeft, paddingRight, 8),
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
                theme.fonts.bodyLarge,
              ]}
            >
              no console logs yet
            </Text>
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            maintainVisibleContentPosition={{
              autoscrollToBottomThreshold: 0.2,
              startRenderingFromBottom: true,
            }}
          />
        )}
      </View>
    </View>
  )
}

const FONT_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
})
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  listContent: {
    paddingVertical: 8,
  },
  logCard: {
    marginVertical: 4,
    elevation: 2,
    borderRadius: 0,
  },
  logContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginVertical: 0,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  logMessage: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
})
