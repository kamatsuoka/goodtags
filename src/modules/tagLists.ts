import { SortOrder } from '@app/constants/Search'
import { TagsById } from '@app/lib/models/Tag'
import { SelectedTag } from './tagListUtil'

export type TagListType = TagListEnum | string // support named labels

export enum TagListEnum {
  SearchResults = 'SearchResults',
  Favorites = 'Favorites',
  Popular = 'Popular',
  Classic = 'Classic',
  Easy = 'Easy',
  New = 'New',
  History = 'History',
}

export enum LoadingState {
  idle = 'idle',
  pending = 'pending',
  morePending = 'morePending',
  succeeded = 'succeeded',
  failed = 'failed',
}

export const SORT_ICONS = {
  [SortOrder.alpha]: 'sort-alphabetical-ascending',
  [SortOrder.downloads]: 'sort-numeric-descending',
  [SortOrder.newest]: 'sort-calendar-descending',
  [SortOrder.id]: 'sort-numeric-ascending',
}

export const SORT_LABELS = {
  [SortOrder.alpha]: 'sort alphabetically',
  [SortOrder.downloads]: 'sort by most downloaded',
  [SortOrder.newest]: 'sort by newest',
  [SortOrder.id]: 'sort by id',
}

export type TagListState = {
  allTagIds: number[] // array of tag ids
  error?: string
  loadingState: LoadingState
  selectedTag?: SelectedTag
  sortOrder: SortOrder
  tagsById: TagsById // map of tag id -> tag
}

export const InitialTagListState: TagListState = {
  allTagIds: [],
  loadingState: LoadingState.idle,
  sortOrder: SortOrder.newest,
  tagsById: {},
}

/**
 * Sort allTagIds alphabetically
 */
export function sortAlpha(state: { tagsById: TagsById; allTagIds: number[] }) {
  sortTagsAlpha(state.tagsById, state.allTagIds)
}

/**
 * Sort allTagIds alphabetically
 */
export function sortTagsAlpha(tagsById: TagsById, allTagIds: number[]) {
  const title = (id: number) =>
    // numeric titles like 1776 can end up being parsed as numbers
    tagsById[id]?.title ? `${tagsById[id].title}` : 'ZZ'
  allTagIds.sort((id1, id2) => title(id1).localeCompare(title(id2)))
}

/**
 * Sort allTagIds by date posted, descending
 */
export function sortPosted(state: { tagsById: TagsById; allTagIds: number[] }) {
  sortTagsPosted(state.tagsById, state.allTagIds)
}

/**
 * Sort allTagIds by date posted, descending
 */
export function sortTagsPosted(tagsById: TagsById, allTagIds: number[]) {
  const posted = (id: number) => tagsById[id]?.posted ?? '1970-01-01'
  allTagIds.sort((id1, id2) => posted(id2).localeCompare(posted(id1)))
}

export function isLabelType(tagListType: TagListType) {
  return typeof tagListType === 'string'
}
