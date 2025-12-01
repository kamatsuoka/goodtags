import { getSelectedTrack } from '@app/modules/tracksSlice'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useEffect, useState } from 'react'
import { useAppSelector } from '.'

type TrackPlayerHook = {
  trackPlaying: boolean
  isLoading: boolean
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

  const player = useAudioPlayer(null, { downloadFirst: true })
  const status = useAudioPlayerStatus(player)
  const playing = status.playing
  const [error, setError] = useState<string | null>(null)
  const [trackUrlState, setTrackUrlState] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // show loading when we've manually initiated loading.
  // status.isBuffering is unreliable on iOS
  const isLoading = loading && !playing && !error

  // clear loading when playing starts or error occurs
  useEffect(() => {
    if (playing || error) {
      setLoading(false)
    }
  }, [playing, error])

  // clear loading when track is loaded
  useEffect(() => {
    if (status.isLoaded && !status.isBuffering) {
      setLoading(false)
    }
  }, [status.isLoaded, status.isBuffering])

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
        setLoading(false)
      } else if (!status.isLoaded || trackUrlState !== selectedTrack.url) {
        console.log('[TrackPlayer] Loading track on play:', selectedTrack.url)
        setError(null)
        setLoading(true)
        player.replace(selectedTrack.url)
        setTrackUrlState(selectedTrack.url)
        player.play()
      } else {
        console.log('[TrackPlayer] Resuming playback')
        setLoading(true)
        player.play()
      }
      setError(null) // Clear error on successful action
    } catch (e) {
      console.error('[TrackPlayer] Playback error:', e)
      setLoading(false)
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
      setLoading(true)
      player.replace(url)
      player.play()
    } catch (e) {
      console.error('[TrackPlayer] Error setting track URL:', e)
      setLoading(false)
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
      console.warn('[TrackPlayer] no track selected')
      setError('no track selected')
      return
    }

    // Check for unsupported file types
    const fileType = (selectedTrack as any)?.file_type?.toLowerCase()
    if (fileType === 'mid' || fileType === 'midi') {
      console.warn('[TrackPlayer] cannot play midi file')
      setError('MIDI files are not supported')
      return
    }

    trackPlayOrPause()
  }

  const pause = () => {
    console.log('[TrackPlayer] pause called')
    try {
      player.pause()
      setLoading(false)
    } catch (e) {
      console.error('[TrackPlayer] Pause error:', e)
      setLoading(false)
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
    isLoading,
    trackPlayOrPause,
    setTrackUrl,
    playOrPause,
    pause,
    error,
    clearError,
  }
}
