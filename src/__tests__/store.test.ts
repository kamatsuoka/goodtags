import { store } from '../store'

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
