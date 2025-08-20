/**
 * utilities for working with tag lists
 */
import { ActionCreatorWithPayload, createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { ClassicActions, selectClassic } from './classicSlice'
import { EasyActions, selectEasy } from './easySlice'
import {
  FavoritesActions,
  selectFavorites,
  selectLabelState,
} from './favoritesSlice'
import { HistoryActions, selectHistory } from './historySlice'
import { NewActions, selectNew } from './newSlice'
import { PopularActions, selectPopular } from './popularSlice'
import { SearchActions, selectSearchResults } from './searchSlice'
import { TagListEnum, TagListState, TagListType } from './tagLists'

export function getTagListSelector(
  tagListType: TagListType,
): (state: RootState) => TagListState {
  switch (tagListType) {
    case TagListEnum.Favorites:
      return selectFavorites
    case TagListEnum.Popular:
      return selectPopular
    case TagListEnum.Classic:
      return selectClassic
    case TagListEnum.Easy:
      return selectEasy
    case TagListEnum.New:
      return selectNew
    case TagListEnum.History:
      return selectHistory
    case TagListEnum.SearchResults:
      return selectSearchResults
    default:
      if (isLabelType(tagListType)) {
        return getLabeledTagListSelector(tagListType)
      }
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}

export function isFavoriteOrLabel(tagListType: TagListType) {
  return tagListType === TagListEnum.Favorites || isLabelType(tagListType)
}

export function isLabelType(tagListType: TagListType) {
  return typeof tagListType === 'string'
}

function getLabeledTagListSelector(label: string) {
  return (state: RootState) => selectLabelState(state.favorites, label)
}

export const makeSelectTagState = () =>
  createSelector(
    [
      (state: RootState) => state,
      (_: RootState, tagListType: TagListType) => tagListType,
    ],
    (state: RootState, tagListType: TagListType) =>
      getTagListSelector(tagListType)(state),
  )

export type SelectedTag = {
  index: number
  id: number
}

export function getSelectedTagSetter(
  tagListType: TagListType,
): ActionCreatorWithPayload<SelectedTag> {
  switch (tagListType) {
    case TagListEnum.Favorites:
      return FavoritesActions.setSelectedFavoriteTag
    case TagListEnum.Popular:
      return PopularActions.setSelectedTag
    case TagListEnum.Classic:
      return ClassicActions.setSelectedTag
    case TagListEnum.Easy:
      return EasyActions.setSelectedTag
    case TagListEnum.New:
      return NewActions.setSelectedTag
    case TagListEnum.History:
      return HistoryActions.setSelectedTag
    case TagListEnum.SearchResults:
      return SearchActions.setSelectedTag
    default:
      if (isLabelType(tagListType)) {
        return FavoritesActions.setSelectedLabeledTag
      }
      throw Error(`Unknown tagListType ${tagListType}`)
  }
}
