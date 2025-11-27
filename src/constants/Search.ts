export const MAX_TAGS = 99

export enum Collection {
  ALL = 'All',
  CLASSIC = 'classic',
  EASY = 'easytags',
}

export const Search = {
  TITLE: 'Title',
  DOWNLOADS: 'Downloads',
  NEWEST: 'Newest',
  TAGS_PER_QUERY: 33,
  API_BASE: 'https://www.barbershoptags.com/api.php?client=goodtags',
}
export type SearchParams = {
  // Filter what we're looking for
  id?: number
  ids?: number[]
  query?: string
  collection?: Collection
  parts?: number
  requireSheetMusic?: boolean
  requireLearningTracks?: boolean
  // Control how we render the results we've filtered to
  sortBy?: SortOrder
  offset?: number
  limit?: number
}

export enum SortOrder {
  alpha = 'alpha',
  downloads = 'downloads',
  id = 'id',
  newest = 'newest',
}

export enum Parts {
  any = 'any',
  four = 'four',
  five = 'five',
  six = 'six',
}
