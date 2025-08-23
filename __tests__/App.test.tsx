/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer'
import App from '../App'

// Mock redux-persist to avoid needing real storage
jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist')
  return {
    ...real,
    persistReducer: jest
      .fn()
      .mockImplementation((_config: any, reducers: any) => reducers),
    persistStore: jest.fn().mockReturnValue({
      purge: jest.fn(),
      flush: jest.fn(),
      pause: jest.fn(),
      subscribe: jest.fn(),
      getState: jest.fn().mockReturnValue({ bootstrapped: true }),
    }),
  }
})

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />)
  })
})
