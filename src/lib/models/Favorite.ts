import Tag, { buildTag } from './Tag'

export interface Favorite extends Tag {
  addedDate: string
}

export function buildFavorite(t: Tag, addedDate: string = new Date().toISOString()): Favorite {
  if ('addedDate' in t) {
    // already a Favorite, just copy it
    return { ...t } as Favorite
  } else {
    const tag = buildTag(
      t.id,
      t.title,
      t.aka,
      t.arranger,
      t.key,
      t.lyrics,
      t.parts,
      t.posted,
      t.uri,
      t.quartet,
      t.quartetUrl,
      t.version,
      t.tracks,
      t.videos,
    ) as Favorite
    tag.addedDate = addedDate
    return tag
  }
}

export interface FavoritesById {
  [key: number]: Favorite
}
