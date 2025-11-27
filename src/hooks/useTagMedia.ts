import Tag from '../lib/models/Tag'

type TagMediaHook = {
  hasTracks: boolean
  hasVideos: boolean
}

/**
 * Hook to check if a tag has tracks or videos available.
 */
export function useTagMedia(tag: Tag): TagMediaHook {
  const hasTracks = tag.tracks?.length > 0 && tag.tracks[0] !== undefined
  const hasVideos = tag.videos?.length > 0 && tag.videos[0] !== undefined

  return { hasTracks, hasVideos }
}

export default useTagMedia
