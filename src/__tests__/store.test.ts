import { store } from '../store'

// fix exception from react-native-sound-player,
// per https://github.com/ocetnik/react-native-background-timer/issues/367#issuecomment-953662440
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
// fix exception per https://github.com/rt2zz/redux-persist/issues/1243#issuecomment-692609748
jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist')
  return {
    ...real,
    persistReducer: jest
      .fn()
      .mockImplementation((config, reducers) => reducers),
  }
})

describe('redux state', () => {
  it('should contain "favorites" and "search" properties', () => {
    const state = store.getState()
    expect(state).toHaveProperty('favorites')
    expect(state).toHaveProperty('search')
  })
})
