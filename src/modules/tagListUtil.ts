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
  tagListType: TagListType | string,
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
      if (isLabelType(tagListType)) {
        return getLabeledTagListSelector(tagListType)
      }
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}

export function isFavoriteOrLabel(tagListType: TagListType | string) {
  return tagListType === TagListType.Favorites || isLabelType(tagListType)
}

export function isLabelType(tagListType: TagListType | string) {
  return typeof tagListType === "string"
}

function getLabeledTagListSelector(label: string) {
  return (state: RootState) => selectLabelState(state.favorites, label)
}

export const makeSelectTagState = () =>
  createSelector(
    [
      (state: RootState) => state,
      (_: RootState, tagListType: TagListType | string) => tagListType,
    ],
    (state: RootState, tagListType: TagListType | string) =>
      getTagListSelector(tagListType)(state),
  )

export type SelectedTag = {
  index: number
  id: number
}

export function getSelectedTagSetter(
  tagListType: TagListType | string,
): ActionCreatorWithPayload<SelectedTag> {
  switch (tagListType) {
    case TagListType.Favorites:
      return FavoritesActions.setSelectedFavoriteTag
    case TagListType.Popular:
      return PopularActions.setSelectedTag
    case TagListType.History:
      return HistoryActions.setSelectedTag
    case TagListType.SearchResults:
      return SearchActions.setSelectedTag
    default:
      if (isLabelType(tagListType)) {
        return FavoritesActions.setSelectedLabeledTag
      }
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}
