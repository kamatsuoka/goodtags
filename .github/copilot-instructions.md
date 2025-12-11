# goodtags AI Coding Assistant Instructions

goodtags is a React Native app (v0.81) for browsing and playing barbershop quartet tags. The app provides searchable access to 2800+ tags with sheet music (PDF), learning tracks (MP3), and YouTube videos.

## Architecture Overview

### State Management (Redux Toolkit)
- **Store**: Centralized at `src/store.ts` with 11 slices combining reducers
- **Key slices**: search, favorites, popular, classic, easy, new, history, tracks, options, visit, random
- **Persistence**: Uses `redux-persist` with `AsyncStorage`, includes migration system in `store.ts`
- **Pattern**: Each slice follows consistent structure - state interface, initialState, createSlice with reducers/extraReducers, selector functions, exported actions
- **Selectors**: Named `selectX` pattern (e.g., `selectFavorites`, `selectHistory`) returning `TagListState`
- **Thunks**: Async operations use `createAsyncThunk` with `ThunkApiConfig` type for type-safe dispatch/state/rejectValue

### Data Layer
- **SQLite database**: Contains all tag metadata, bundled with app and auto-updates from remote server
- **Database lifecycle**: `warmupDb()` called in `index.js` at startup to initialize DB connection
- **Dynamic updates**: `DbWrapper` class in `src/modules/sqlUtil.ts` manages safe hot-swapping of DB files while queries are in-flight
- **Update flow**: On first DB access, copies from app bundle if needed, then checks remote server for newer version in background
- **Remote sync**: Manifest-based versioning (`manifest.json` + schema versions), DB downloads compressed (~4x smaller with gzip)
- **Search**: Queries run against local SQLite via `expo-sqlite`, results converted to `Tag` objects by `fetchAndConvertTags()`

### Navigation Structure
- **Root**: `RootStackNavigator` wraps tab navigator + modals (Settings, TagView)
- **Tabs**: Bottom tab navigation with Home, Search, Favorites, Random screens
- **Home navigator**: Nested stack for Popular, Classic, Easy, New, Labels, Options, Data
- **Type safety**: `navigationParams.ts` defines all param lists with `CompositeScreenProps` typing
- **Navigation flow**: User browses tag lists → taps tag → opens TagView modal with sheet music + tracks

### Platform-Specific Patterns

#### Native Modules
- **Android StatusBar**: Custom `StatusBarModule.kt` for edge-to-edge compatibility, registered in `StatusBarPackage.kt` and added to `MainApplication.kt`
- **Conditional import**: StatusBarModule only imported on Android (`Platform.OS === 'android'`), null on iOS
- **Audio setup**: `expo-audio` configured for silent mode playback in `App.tsx`

#### Build & Deploy
- **Version bumping**: Use `yarn bump-ios-version [patch|minor|major]` to sync versions across platforms
- **iOS**: `yarn deploy:ios` auto-increments build number, builds archive, uploads to TestFlight
- **Android**: `yarn deploy:android` auto-increments versionCode, builds AAB for Play Store
- **Signing**: Android requires keystore setup via `yarn setup:android-signing` (one-time)

## Code Conventions

### Import Aliases
- Use `@app/*` for all src imports (configured in `tsconfig.json`, `babel.config.js`, `jest.config.js`)
- Example: `import { useAppSelector } from '@app/hooks'`

### TypeScript Patterns
- Hooks: `useAppSelector` and `useAppDispatch` instead of raw react-redux hooks (typed wrappers in `src/hooks/useAppDispatch.ts`)
- State types: `RootState` from store, `AppDispatch` for dispatch typing
- Component props: Define explicit interface, destructure in function signature

### Testing
- Unit tests: Jest with `@testing-library/react-native`, run `yarn test`
- Location: `src/__tests__/` and `src/components/__tests__/`
- Mock patterns: Redux store mocked via `redux-mock-store`, native modules mocked in `__mocks__/`
- Requirement: Add tests for any logic, don't just suggest - implement them

### Styling
- Use `react-native-paper` theme for consistent colors/typography
- Get theme via `useTheme()` hook, access via `theme.colors.primary` etc
- StyleSheet.create for component styles, avoid inline styles
- Responsive: `useWindowShape()` hook for orientation, `useSafeAreaInsets()` for safe areas

## Key Files

- `App.tsx`: Entry point with Redux Provider, PersistGate, ErrorBoundary, navigation root
- `src/store.ts`: Redux store config with persistence and migrations
- `src/modules/sqlUtil.ts`: Database initialization, hot-swapping, remote updates
- `src/navigation/RootStackNavigator.tsx`: Main navigation structure
- `package.json`: Scripts for build/deploy/version management
- `deploy/deploy-*.sh`: Automated deployment scripts for both platforms

## Development Workflow

### Running the App
```bash
yarn start              # Start Metro bundler
yarn ios                # Build and run iOS simulator
yarn android            # Build and run Android emulator
yarn test               # Run Jest tests
```

### iOS First Run
```bash
bundle install          # Install Ruby gems (CocoaPods)
bundle exec pod install # Install iOS native dependencies
```

### Common Tasks
- **Add dependency**: `yarn add <package>`, then `cd ios && bundle exec pod install` for native modules
- **Clear caches**: For weird errors, clear Metro cache (`yarn start --reset-cache`), rebuild native (`yarn ios/android`)
- **Update DB locally**: Run `yarn downloadLatestSearchDb` (TypeScript script in `scripts/`)

## Comments & Commit Messages
- prefer lowercase for comments and commit messages
- be concise but descriptive

## Testing Requirements
When implementing features with logic:
- Add unit tests in parallel with implementation
- Place tests in appropriate `__tests__/` directory
- Mock external dependencies (native modules, network, storage)
- Test both success and error paths for async operations
