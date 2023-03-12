/**
 * utilities for working with tag lists
 */
import {ActionCreatorWithPayload} from "@reduxjs/toolkit"
import {RootState} from "../store"
import {FavoritesActions, selectFavorites} from "./favoritesSlice"
import {HistoryActions, selectHistory} from "./historySlice"
import {PopularActions, selectPopular} from "./popularSlice"
import {SearchActions, selectSearchResults} from "./searchSlice"
import {TagListState, TagListType} from "./tagLists"

export function getTagListSelector(
  tagListType: TagListType,
): (state: RootState) => TagListState {
  switch (tagListType) {
    case TagListType.Favorites:
      return selectFavorites
    case TagListType.Popular:
      return selectPopular
    case TagListType.History:
      return selectHistory
    case TagListType.SearchResults:
      return selectSearchResults
    default:
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}

export type SelectedTag = {
  index: number
  id: number
}

export function getSelectedTagSetter(
  tagListType: TagListType,
): ActionCreatorWithPayload<SelectedTag> {
  switch (tagListType) {
    case TagListType.Favorites:
      return FavoritesActions.setSelectedTag
    case TagListType.Popular:
      return PopularActions.setSelectedTag
    case TagListType.History:
      return HistoryActions.setSelectedTag
    case TagListType.SearchResults:
      return SearchActions.setSelectedTag
    default:
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}
