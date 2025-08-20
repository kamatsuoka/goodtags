import { SortOrder } from '@app/constants/Search'
import Tag, { EmptyTag } from '../../lib/models/Tag'
import historyReducer, {
  HistoryActions,
  HistoryState,
  InitialState,
  MAX_HISTORY,
} from '../historySlice'
import { LoadingState, sortAlpha } from '../tagLists'

function buildTag(id: number): Tag {
  const tag: Tag = { ...EmptyTag }
  Object.keys(tag).forEach(key => {
    if (!(key in ['id', 'parts', 'tracks', 'videos'])) {
      // @ts-ignore
      tag[key] = `${key}${id}`
    }
  })
  tag.id = id
  tag.parts = 4
  return tag
}

const tag12 = buildTag(12)

/**
 * Produces an expected history state with history *not* incorporated into allTagIds
 *
 * @param tags tags *in the order in which they were added*
 */
function unincorporatedHistoryState(
  tags: Tag[],
  timestamp: string,
): HistoryState {
  const history = tags.map(t => t.id).reverse() // history starts with most recent
  return {
    tagsById: Object.fromEntries(tags.map(t => [t.id, t])),
    allTagIds: [],
    history: history,
    lastModified: timestamp,
    loadingState: LoadingState.idle,
    sortOrder: SortOrder.newest,
  }
}

/**
 * Produces an expected history state with history incorporated into allTagIds for display
 *
 * @param tags tags *in the order in which they were added*
 */
function incorporatedHistoryState(
  tags: Tag[],
  timestamp: string,
  sortOrder: SortOrder,
): HistoryState {
  const history = tags.map(t => t.id).reverse() // history starts with most recent
  const state = {
    tagsById: Object.fromEntries(tags.map(t => [t.id, t])),
    allTagIds: [...history],
    history: history,
    lastModified: timestamp,
    loadingState: LoadingState.idle,
    sortOrder: sortOrder,
  }
  if (sortOrder === SortOrder.alpha) sortAlpha(state)
  return state
}

function addTagsToHistory(
  tags: Tag[],
  initialState: HistoryState = InitialState,
) {
  let reducedState = initialState
  let timestamp = ''
  const date = new Date()
  tags.forEach(tag => {
    timestamp = date.setFullYear(date.getFullYear() + 1).toString()
    const action = HistoryActions.addHistory({
      tag: tag,
      timestamp: timestamp,
    })
    reducedState = historyReducer(reducedState, action)
  })
  return {
    reducedState,
    timestamp,
  }
}

describe('history reducer', () => {
  it('should add a tag to the history', () => {
    const timestamp = new Date().toISOString()
    const action = HistoryActions.addHistory({
      tag: tag12,
      timestamp: timestamp,
    })
    const reducedState = historyReducer(InitialState, action)
    const expectedState: HistoryState = unincorporatedHistoryState(
      [tag12],
      timestamp,
    )
    expect(reducedState).toEqual(expectedState)
  })
  it('should add several tags to the history', () => {
    const tags = Array.from(Array(5).keys()).map(i => buildTag(i))
    const { reducedState, timestamp } = addTagsToHistory(tags)
    // expect history to show tags in reverse order (starting with last tag added)
    const expectedState: HistoryState = unincorporatedHistoryState(
      tags,
      timestamp,
    )
    expect(reducedState).toEqual(expectedState)
  })
  it('should incorporate tags to displayed tag list', () => {
    const tags = Array.from(Array(5).keys()).map(i => buildTag(i))
    const { reducedState, timestamp } = addTagsToHistory(tags)
    const incorporateAction = HistoryActions.incorporateHistory()
    const incorporatedState = historyReducer(reducedState, incorporateAction)
    // expect history to show tags in reverse order (starting with last tag added)
    const expectedState = unincorporatedHistoryState(tags, timestamp)
    // with default sort (newest first), display tags is same as history
    expectedState.allTagIds = expectedState.history
    expect(incorporatedState).toEqual(expectedState)
  })
  it('should incorporate tags to displayed tag list when sorting by title', () => {
    const initialState = {
      ...InitialState,
      sortOrder: SortOrder.alpha,
    }
    const tags = Array.from(Array(5).keys()).map(i => buildTag(i))
    const { reducedState, timestamp } = addTagsToHistory(tags, initialState)
    const incorporatedState = historyReducer(
      reducedState,
      HistoryActions.incorporateHistory(),
    )
    const expectedState = incorporatedHistoryState(
      tags,
      timestamp,
      SortOrder.alpha,
    )
    expect(incorporatedState).toEqual(expectedState)
  })
  it('should kick out old history when adding more than MAX_HISTORY', () => {
    const historyOverMax = 10
    const numTags = MAX_HISTORY + historyOverMax
    const allIds = Array.from(Array(numTags).keys()) // [0, 1, 2, ... , MAX_HISTORY - 1]
    const tags = allIds.map(i => buildTag(i))
    const { reducedState } = addTagsToHistory(tags, InitialState)
    expect(reducedState.history.length).toEqual(MAX_HISTORY)
    expect(Object.keys(reducedState.tagsById).length).toEqual(MAX_HISTORY)
    // expected ids in history are highest MAX_HISTORY elements
    const expectedIds = allIds.reverse().slice(0, MAX_HISTORY)
    expect(reducedState.history).toEqual(expectedIds)
  })
})
