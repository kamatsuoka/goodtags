/**
 * utilities for working with tag lists
 */
import {ActionCreatorWithPayload, createSelector} from "@reduxjs/toolkit"
import {RootState} from "../store"
import {
  FavoritesActions,
  selectFavorites,
  selectLabelState,
} from "./favoritesSlice"
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

function getLabelTagListSelector(label: string) {
  return (state: RootState) => selectLabelState(state.favorites, label)
}

export const makeSelectTagState = () =>
  createSelector(
    [
      state => state,
      (_, tagListType) => tagListType,
      (_, tagListId) => tagListId,
    ],
    (state, tagListType, tagListId) =>
      tagListType === TagListType.Label
        ? getLabelTagListSelector(tagListId)(state)
        : getTagListSelector(tagListType)(state),
  )

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
    case TagListType.Label:
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
