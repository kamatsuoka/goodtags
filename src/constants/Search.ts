export const MAX_TAGS = 99

export enum Collection {
  ALL = "All",
  CLASSIC = "Classic",
  EASY = "Easy",
}

export const Search = {
  TITLE: "Title",
  DOWNLOADS: "Downloads",
  NEWEST: "Newest",
  TAGS_PER_QUERY: 33,
  API_BASE: "https://www.barbershoptags.com/api.php?client=goodtags",
}
export type QueryParams = {
  q?: string
  start?: number
  id?: number
  n?: number
  Collection?: string
  Sortby?: string
  SheetMusic?: string
  Learning?: string
  Parts?: number
}

export enum SortOrder {
  alpha = "alpha",
  downloads = "downloads",
  newest = "newest",
}

export enum Parts {
  any = "any",
  four = "four",
  five = "five",
  six = "six",
}
