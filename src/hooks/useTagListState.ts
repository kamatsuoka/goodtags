import { useAppSelector } from '@app/hooks'
import { TagListType } from '@app/modules/tagLists'
import { makeSelectTagState } from '@app/modules/tagListUtil'
import { RootState } from '@app/store'
import { useMemo } from 'react'

/**
 * Get tag state for tag list type
 */
export default function useTagListState(tagListType: TagListType) {
  const memoizedSelector = useMemo(makeSelectTagState, [])

  const getSelector = (state: RootState) => memoizedSelector(state, tagListType)

  return useAppSelector(getSelector)
}
