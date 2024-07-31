import {useAppSelector} from "@app/hooks"
import {TagListType} from "@app/modules/tagLists"
import {
  makeSelectTagsByLabel,
  makeSelectTagState,
} from "@app/modules/tagListUtil"
import {RootState} from "@app/store"

/**
 * Get tag state for tag list type
 */
export default function useTagListState(tagListType: TagListType) {
  const selectedLabel = useAppSelector(state => state.favorites.selectedLabel)
  const selectTagsByLabel =
    tagListType === TagListType.Label ? makeSelectTagsByLabel() : null

  const getSelector = (state: RootState) =>
    selectTagsByLabel
      ? selectTagsByLabel(state, selectedLabel)
      : makeSelectTagState()(state, tagListType)

  return useAppSelector(getSelector)
}
