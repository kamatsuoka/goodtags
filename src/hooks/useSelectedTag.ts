import {EmptyTag} from "@app/lib/models/Tag"
import {TagListType} from "@app/modules/tagLists"
import useTagListState from "./useTagListState"

/**
 * Get selected tag
 */
export default function useSelectedTag(tagListType: TagListType | string) {
  const tagListState = useTagListState(tagListType)

  const allTagIds = tagListState.allTagIds
  const tagsById = tagListState.tagsById
  const selectedTag = tagListState.selectedTag

  function indexValid(index: number) {
    return index >= 0 && index < allTagIds.length
  }

  if (selectedTag && indexValid(selectedTag.index)) {
    const tagId = allTagIds[selectedTag.index]
    if (tagId === selectedTag.id) {
      const t = tagsById[tagId]
      return t || EmptyTag
    }
  }
  // may happen when last favorite is removed
  return EmptyTag
}
