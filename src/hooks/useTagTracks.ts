import { useAppDispatch } from '@app/hooks/useAppDispatch'
import Tag from '@app/lib/models/Tag'
import { setTagTracks } from '@app/modules/tracksSlice'
import { useEffect } from 'react'

export const useTagTracks = (tag: Tag) => {
  const dispatch = useAppDispatch()

  // set track data into store
  useEffect(() => {
    dispatch(setTagTracks(tag))
  }, [dispatch, tag])
}
