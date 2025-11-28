import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '.'
import { getSelectedTrack } from '../modules/tracksSlice'

type TrackPlayerHook = {
  audioPlaying: boolean
  trackPlayOrPause: () => void
  setTrackUrl: (url: string) => void
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
  const manualChangeRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const loadAttemptRef = useRef<{ url: string; time: number } | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('[TrackPlayer] Status update:', {
      isLoaded: status.isLoaded,
      isBuffering: status.isBuffering,
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
      trackUrl: selectedTrack?.url,
    })
  }, [status, selectedTrack?.url])

  // Load the URL when it changes (but not if we just manually changed it)
  useEffect(() => {
    const url = selectedTrack?.url
    if (url && !manualChangeRef.current) {
      console.log('[TrackPlayer] Loading new track:', url)

      // Check for unsupported file types
      const fileType = (selectedTrack as any)?.file_type?.toLowerCase()
      if (fileType === 'mid' || fileType === 'midi') {
        console.warn('[TrackPlayer] MIDI files are not supported')
        setError(
          'MIDI files cannot be played in the app. Please use the tracks menu to find an audio version.',
        )
        return
      }

      setError(null) // Clear any previous errors
      loadAttemptRef.current = { url, time: Date.now() }
      try {
        player.replace(url)
      } catch (e) {
        console.error('[TrackPlayer] Error loading track:', e)
        const errorMsg = `Failed to load track: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`
        setError(errorMsg)
      }
    }
    manualChangeRef.current = false
  }, [selectedTrack?.url, selectedTrack, player])

  // Monitor for load failures
  useEffect(() => {
    if (!loadAttemptRef.current) return

    const checkTimer = setTimeout(() => {
      const loadAttempt = loadAttemptRef.current
      if (!loadAttempt) return

      const timeSinceLoad = Date.now() - loadAttempt.time
      const stillLoading = loadAttempt.url === selectedTrack?.url

      console.log('[TrackPlayer] Load check:', {
        timeSinceLoad,
        stillLoading,
        isLoaded: status.isLoaded,
        isBuffering: status.isBuffering,
        playing: status.playing,
      })

      if (
        stillLoading &&
        !status.isLoaded &&
        !status.isBuffering &&
        !playing &&
        timeSinceLoad > 2000
      ) {
        console.error('[TrackPlayer] Track failed to load')
        setError('Unable to load audio track. The file may not be available.')
        loadAttemptRef.current = null
      }
    }, 3000)

    // Clear error when successfully loaded or playing
    if (status.isLoaded || playing) {
      console.log('[TrackPlayer] Track loaded successfully')
      loadAttemptRef.current = null
      setError(null)
    }

    return () => clearTimeout(checkTimer)
  }, [status.isLoaded, status.isBuffering, playing, selectedTrack?.url, status])

  const trackPlayOrPause = () => {
    console.log('[TrackPlayer] trackPlayOrPause called, playing:', playing)

    // Check for unsupported file types before playing
    const fileType = (selectedTrack as any)?.file_type?.toLowerCase()
    if (fileType === 'mid' || fileType === 'midi') {
      console.warn('[TrackPlayer] Cannot play MIDI file')
      setError(
        'MIDI files cannot be played in the app. Please use the tracks menu to find an audio version.',
      )
      return
    }

    try {
      if (status.playing) {
        player.pause()
      } else {
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

  const setTrackUrl = (newUrl: string) => {
    console.log('[TrackPlayer] setTrackUrl called:', newUrl)
    try {
      manualChangeRef.current = true
      setError(null) // Clear any previous errors
      loadAttemptRef.current = { url: newUrl, time: Date.now() }
      player.replace(newUrl)
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
    audioPlaying: playing,
    trackPlayOrPause,
    setTrackUrl,
    playOrPause,
    pause,
    error,
    clearError,
  }
}

export default useTrackPlayer
