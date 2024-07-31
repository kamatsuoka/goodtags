import {useAppSelector} from "@app/hooks"
import {EmptyTag} from "@app/lib/models/Tag"
import {TagListType} from "@app/modules/tagLists"
import {
  getTagListSelector,
  makeSelectTagsByLabel,
} from "@app/modules/tagListUtil"
import {RootState} from "@app/store"

/**
 * Get selected tag
 */
export default function useSelectedTag(tagListType: TagListType) {
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const selectTagsByLabel =
    tagListType === TagListType.Label ? makeSelectTagsByLabel() : null

  const getSelector = (state: RootState) =>
    selectTagsByLabel
      ? selectTagsByLabel(state, selectedLabel)
      : getTagListSelector(tagListType)(state)

  const allTagIds = useAppSelector(state => getSelector(state).allTagIds)
  const tagsById = useAppSelector(state => getSelector(state).tagsById)
  const selectedTag = useAppSelector(state => getSelector(state).selectedTag)

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
