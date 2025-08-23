import { NavigationContainer } from '@react-navigation/native'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import TagList from '../TagList'

// Mock the persisted store with minimal reducers needed by TagList
jest.mock('@app/store', () => {
  const { configureStore, createSlice } = require('@reduxjs/toolkit')
  const tagsSlice = createSlice({
    name: 'history',
    initialState: { allTagIds: [], tagsById: {}, selectedTag: undefined },
    reducers: {},
  })
  const visitSlice = createSlice({
    name: 'visit',
    initialState: { tagState: undefined },
    reducers: {},
  })
  const optionsSlice = createSlice({
    name: 'options',
    initialState: { autoRotate: false },
    reducers: {},
  })
  const store = configureStore({
    reducer: {
      history: tagsSlice.reducer,
      visit: visitSlice.reducer,
      options: optionsSlice.reducer,
    },
  })
  return { store }
})

import { TagListEnum } from '@app/modules/tagLists'
import { store } from '@app/store'

test('renders TagList empty state', () => {
  const listRef: any = { current: null }
  const { getByText } = render(
    <Provider store={store}>
      <NavigationContainer>
        <TagList
          title="Test"
          emptyMessage="No tags"
          tagListType={TagListEnum.History}
          listRef={listRef}
        />
      </NavigationContainer>
    </Provider>,
  )
  expect(getByText('No tags')).toBeTruthy()
})
