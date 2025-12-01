import { useAppDispatch } from '@app/hooks/useAppDispatch'
import Tag from '@app/lib/models/Tag'
import { HistoryActions } from '@app/modules/historySlice'
import { useEffect } from 'react'

const HISTORY_MIN_VIEW_TIME = 7000

export const useTagHistory = (tag: Tag) => {
  const dispatch = useAppDispatch()

  // after viewing tag for a while, add it to history
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(HistoryActions.addHistory({ tag }))
    }, HISTORY_MIN_VIEW_TIME)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [dispatch, tag])
}
