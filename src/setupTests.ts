// Minimal test setup for React Native environment.
import 'react-native-gesture-handler/jestSetup'

// Extend expect (added also via jest.config but harmless)
import '@testing-library/jest-native/extend-expect'

// Mock only the modules we directly rely on that are problematic in Node.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
)

// Expo module mocks (enough for tests using sqlUtil etc.)
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({ uri: 'mock-asset-uri' }),
  },
}))

jest.mock('expo-constants', () => ({
  default: { expoConfig: {}, manifest: {}, appOwnership: 'standalone' },
}))

jest.mock('expo-file-system', () => ({
  documentDirectory: '/data/',
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => {}),
  readAsStringAsync: jest.fn(async () => '{}'),
  writeAsStringAsync: jest.fn(async () => {}),
  moveAsync: jest.fn(async () => {}),
  downloadAsync: jest.fn(async (_from, to) => ({ uri: to })),
  copyAsync: jest.fn(async () => {}),
}))

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    withTransactionAsync: async (cb: () => Promise<void>) => {
      await cb()
    },
    getAllAsync: async () => [],
    closeAsync: () => {},
  })),
}))

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    setPlaybackRate: jest.fn(),
    setVolume: jest.fn(),
  })),
  setAudioModeAsync: jest.fn(async () => {}),
}))

jest.mock('react-native-pdf-renderer', () => 'PdfRendererView')
jest.mock('react-native-webview', () => 'WebView')
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(async () => ({ assets: [] })),
  pickSingle: jest.fn(async () => ({})),
  isErrorWithCode: () => false,
  errorCodes: {},
}))

// Navigation helpers
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
  }
})

// Safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// Suppress noisy warnings
const originalWarn = console.warn
const originalError = console.error
const originalLog = console.log

console.warn = (...args: any[]) => {
  const msg = args[0]
  if (
    typeof msg === 'string' &&
    (msg.includes('[Reanimated]') ||
      msg.includes('deprecated') ||
      msg.includes('Require cycle') ||
      msg.includes('EXNativeModulesProxy') ||
      msg.includes('expo-modules-core') ||
      msg.includes('process.env.EXPO_OS') ||
      msg.includes('babel-preset-expo'))
  ) {
    return
  }
  originalWarn(...args)
}

console.error = (...args: any[]) => {
  const msgStr = args.join(' ')
  if (
    msgStr.includes('Error checking backup reminder') ||
    msgStr.includes('this.props.persistor.subscribe is not a function') ||
    msgStr.includes('SafeAreaProviderCompat') ||
    msgStr.includes("Cannot read properties of undefined (reading 'Consumer')")
  ) {
    return
  }
  originalError(...args)
}

console.log = (...args: any[]) => {
  const msg = args[0]
  if (typeof msg === 'string' && msg.includes('persistConfig.version=')) {
    return
  }
  originalLog(...args)
}
