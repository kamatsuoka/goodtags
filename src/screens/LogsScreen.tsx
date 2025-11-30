import { useBodyInsets } from '@app/hooks'
import { useRef, useState } from 'react'
import { FlatList, Platform, StyleSheet, View } from 'react-native'
import { Card, Chip, IconButton, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LogEntry {
  id: string
  timestamp: Date
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  args: any[]
}

const MAX_LOGS = 100

// Global log storage
const logStorage: LogEntry[] = []
let logIdCounter = 0

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
}

// Intercept console methods
const interceptConsole = () => {
  const createInterceptor = (type: LogEntry['type']) => {
    return (...args: any[]) => {
      // Call original method
      originalConsole[type](...args)

      // Store log entry
      const entry: LogEntry = {
        id: `log-${logIdCounter++}`,
        timestamp: new Date(),
        type,
        message: args.map(arg => String(arg)).join(' '),
        args,
      }

      logStorage.push(entry)

      // Keep only last MAX_LOGS entries
      if (logStorage.length > MAX_LOGS) {
        logStorage.shift()
      }
    }
  }

  console.log = createInterceptor('log')
  console.warn = createInterceptor('warn')
  console.error = createInterceptor('error')
  console.info = createInterceptor('info')
}

// Initialize console interception
interceptConsole()

/**
 * Screen displaying the last 100 console logs
 */
export default function LogsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const [logs, setLogs] = useState<LogEntry[]>([...logStorage])
  const [autoScroll, setAutoScroll] = useState(true)
  const flatListRef = useRef<FlatList>(null)

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return theme.colors.error
      case 'warn':
        return theme.colors.tertiary
      case 'info':
        return theme.colors.primary
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
            // icon={getLogIcon(item.type)}
            style={[
              styles.typeChip,
              { backgroundColor: getLogColor(item.type) },
            ]}
            textStyle={styles.typeChipText}
          >
            {item.type.toUpperCase()}
          </Chip>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
      </Card.Content>
    </Card>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(paddingLeft, paddingRight, 8),
      paddingBottom: insets.bottom,
    },
    actionButtons: {
      position: 'absolute',
      top: 0,
      right: 8,
      flexDirection: 'row',
      zIndex: 1,
    },
    header: {
      backgroundColor: theme.colors.primary,
    },
    listContent: {
      paddingVertical: 8,
    },
    logCard: {
      marginVertical: 4,
      elevation: 2,
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
      color: theme.colors.onPrimary,
      marginVertical: 0,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
    },
    logMessage: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.actionButtons}>
        <IconButton
          icon={autoScroll ? 'arrow-down-bold' : 'arrow-down-bold-outline'}
          iconColor={theme.colors.onPrimary}
          onPress={() => setAutoScroll(!autoScroll)}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.onPrimary}
          onPress={() => {
            logStorage.length = 0
            setLogs([])
          }}
        />
      </View>
      <View style={styles.content}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No console logs yet.{'\n\n'}
              Navigate around the app to see logs appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            onScrollBeginDrag={() => setAutoScroll(false)}
          />
        )}
      </View>
    </View>
  )
}
