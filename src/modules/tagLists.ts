import {SortOrder} from "../constants/Search"
import {TagsById} from "../lib/models/Tag"
import {SelectedTag} from "./tagListUtil"

export enum TagListType {
  SearchResults = "SearchResults",
  Favorites = "Favorites",
  Popular = "Popular",
  History = "History",
}

export enum LoadingState {
  idle = "idle",
  pending = "pending",
  morePending = "morePending",
  succeeded = "succeeded",
  failed = "failed",
}

export const SORT_ICONS = {
  [SortOrder.alpha]: "sort-alphabetical-ascending",
  [SortOrder.downloads]: "sort-numeric-descending",
  [SortOrder.newest]: "sort-calendar-descending",
}

export const SORT_LABELS = {
  [SortOrder.alpha]: "sort alphabetically",
  [SortOrder.downloads]: "sort by most downloaded",
  [SortOrder.newest]: "sort by newest",
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
export function sortAlpha(state: {tagsById: TagsById; allTagIds: number[]}) {
  sortTagsAlpha(state.tagsById, state.allTagIds)
}

/**
 * Sort allTagIds alphabetically
 */
export function sortTagsAlpha(tagsById: TagsById, allTagIds: number[]) {
  const title = (id: number) =>
    // numeric titles like 1776 can end up being parsed as numbers
    tagsById[id]?.title ? `${tagsById[id].title}` : "ZZ"
  allTagIds.sort((id1, id2) => title(id1).localeCompare(title(id2)))
}
