import { useAppSelector } from '@app/hooks/useAppDispatch'
import { TagListType } from '@app/modules/tagLists'
import { makeSelectTagState } from '@app/modules/tagListUtil'
import { RootState } from '@app/store'
import { useMemo } from 'react'

/**
 * Get tag state for tag list type
 */
export function useTagListState(tagListType: TagListType) {
  const memoizedSelector = useMemo(makeSelectTagState, [])

  const getSelector = (state: RootState) => memoizedSelector(state, tagListType)

  return useAppSelector(getSelector)
}
