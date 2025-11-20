import { useEffect } from 'react'
import Tag from '../lib/models/Tag'
import { HistoryActions } from '../modules/historySlice'
import { setTagTracks, stopTrack } from '../modules/tracksSlice'
import { useAppDispatch } from './index'

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

  // when the component unmounts, stop the track
  useEffect(() => {
    return () => {
      dispatch(stopTrack())
    }
  }, [dispatch])
}
