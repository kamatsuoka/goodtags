import { useAppSelector } from '.'
import { getSelectedTrack } from '../modules/tracksSlice'
import useTrackPlayer from './useTrackPlayer'

type TagTrackPlayerHook = {
  audioPlaying: boolean
  trackPlayOrPause: () => void
  setTrackUrl: (url: string) => void
  playOrPause: () => void
  pause: () => void
}

/**
 * Hook that combines track state selection with the audio player.
 * Returns the playing state, play/pause controls, and setUrl function.
 */
export function useTagTrackPlayer(): TagTrackPlayerHook {
  const tracksState = useAppSelector(state => state.tracks)
  const selectedTrack = getSelectedTrack(
    tracksState.tagTracks,
    tracksState.selectedPart,
  )
  const {
    playing: audioPlaying,
    playOrPause: trackPlayOrPause,
    setTrackUrl,
    player,
  } = useTrackPlayer(selectedTrack?.url)

  const playOrPause = () => {
    if (selectedTrack) {
      trackPlayOrPause()
    }
  }

  const pause = () => {
    player.pause()
  }

  return { audioPlaying, trackPlayOrPause, setTrackUrl, playOrPause, pause }
}

export default useTagTrackPlayer
