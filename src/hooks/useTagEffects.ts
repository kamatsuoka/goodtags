import { useAppDispatch } from '@app/hooks/useAppDispatch'
import Tag from '@app/lib/models/Tag'
import { HistoryActions } from '@app/modules/historySlice'
import { setTagTracks } from '@app/modules/tracksSlice'
import { useEffect } from 'react'

const HISTORY_MIN_VIEW_TIME = 7000

export const useTagEffects = (tag: Tag) => {
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

  // set track data into store
  useEffect(() => {
    dispatch(setTagTracks(tag))
  }, [dispatch, tag])
}
