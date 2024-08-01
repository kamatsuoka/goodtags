import {useAppSelector} from "@app/hooks"
import {TagListType} from "@app/modules/tagLists"
import {makeSelectTagState} from "@app/modules/tagListUtil"
import {RootState} from "@app/store"
import {useMemo} from "react"

/**
 * Get tag state for tag list type
 */
export default function useTagListState(
  tagListType: TagListType,
  label: string,
) {
  const labelForList =
    tagListType === TagListType.Label ? label : tagListType.toString()

  const memoizedSelector = useMemo(makeSelectTagState, [labelForList])

  const getSelector = (state: RootState) =>
    memoizedSelector(state, tagListType, labelForList)

  return useAppSelector(getSelector)
}
