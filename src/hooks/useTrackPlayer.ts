import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useEffect, useState } from 'react'
import { useAppSelector } from '.'
import { getSelectedTrack } from '../modules/tracksSlice'

type TrackPlayerHook = {
  trackPlaying: boolean
  trackPlayOrPause: () => void
  setTrackUrl: (url: string | null) => void
  playOrPause: () => void
  pause: () => void
  error: string | null
  clearError: () => void
}

/**
 * Hook that combines track state selection with the audio player.
 * Returns the playing state, play/pause controls, setUrl function, and error handling.
 */
export function useTrackPlayer(): TrackPlayerHook {
  const tracksState = useAppSelector(state => state.tracks)
  const selectedTrack = getSelectedTrack(
    tracksState.tagTracks,
    tracksState.selectedPart,
  )

  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  const playing = status.playing
  const [error, setError] = useState<string | null>(null)
  const [trackUrl, setTrackUrlState] = useState<string | null>(null)

  useEffect(() => {
    if (status.isLoaded || playing) {
      setError(null)
    }
  }, [status.isLoaded, status.isBuffering, playing, selectedTrack?.url, status])

  // allow replaying track after it ends
  useEffect(() => {
    // note: status.duration is not provided by expo-audio, but currentTime becomes NaN when track ends
    if (status.isLoaded && !status.playing && isNaN(status.currentTime)) {
      console.log('[TrackPlayer] Track finished, seeking to start')
      player.seekTo(0)
    }
  }, [status.isLoaded, status.playing, status.currentTime, player])

  const trackPlayOrPause = () => {
    console.log('[TrackPlayer] trackPlayOrPause called, playing:', playing)

    if (!selectedTrack?.url) {
      console.warn('[TrackPlayer] No track URL available')
      setError('No track available')
      return
    }

    try {
      if (status.playing) {
        console.log('[TrackPlayer] Pausing playback')
        player.pause()
      } else if (!status.isLoaded || trackUrl !== selectedTrack.url) {
        console.log('[TrackPlayer] Loading track on play:', selectedTrack.url)
        setError(null)
        player.replace(selectedTrack.url)
        setTrackUrlState(selectedTrack.url)
        player.play()
      } else {
        console.log('[TrackPlayer] Resuming playback')
        player.play()
      }
      setError(null) // Clear error on successful action
    } catch (e) {
      console.error('[TrackPlayer] Playback error:', e)
      const errorMsg = `Playback error: ${
        e instanceof Error ? e.message : 'Unknown error'
      }`
      setError(errorMsg)
    }
  }

  const setTrackUrl = (url: string | null) => {
    console.log('[TrackPlayer] setTrackUrl called:', url)
    try {
      setError(null)
      player.replace(url)
      player.play()
    } catch (e) {
      console.error('[TrackPlayer] Error setting track URL:', e)
      const errorMsg = `Failed to load track: ${
        e instanceof Error ? e.message : 'Unknown error'
      }`
      setError(errorMsg)
    }
  }

  const playOrPause = () => {
    console.log(
      '[TrackPlayer] playOrPause called, selectedTrack:',
      selectedTrack,
    )

    if (!selectedTrack) {
      console.warn('[TrackPlayer] No track selected')
      setError('No track selected')
      return
    }

    // Check for unsupported file types
    const fileType = (selectedTrack as any)?.file_type?.toLowerCase()
    if (fileType === 'mid' || fileType === 'midi') {
      console.warn('[TrackPlayer] Cannot play MIDI file')
      setError(
        'MIDI files cannot be played in the app. Please use the tracks menu to find an audio version.',
      )
      return
    }

    trackPlayOrPause()
  }

  const pause = () => {
    console.log('[TrackPlayer] pause called')
    try {
      player.pause()
    } catch (e) {
      console.error('[TrackPlayer] Pause error:', e)
      const errorMsg = `Pause error: ${
        e instanceof Error ? e.message : 'Unknown error'
      }`
      setError(errorMsg)
    }
  }

  const clearError = () => {
    console.log('[TrackPlayer] clearError called')
    setError(null)
  }

  // Log error state changes
  useEffect(() => {
    if (error) {
      console.error('[TrackPlayer] Error state set:', error)
    }
  }, [error])

  return {
    trackPlaying: playing,
    trackPlayOrPause,
    setTrackUrl,
    playOrPause,
    pause,
    error,
    clearError,
  }
}

export default useTrackPlayer
