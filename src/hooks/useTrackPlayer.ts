import {
  AudioPlayer,
  AudioStatus,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'
import { useEffect, useRef } from 'react'

type TrackPlayerHook = {
  player: AudioPlayer
  status: AudioStatus
  playing: boolean
  playOrPause: () => void
  setTrackUrl: (newUrl: string) => void
}

export function useTrackPlayer(url?: string): TrackPlayerHook {
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  const playing = status.playing
  const manualChangeRef = useRef(false)

  // Load the URL when it changes (but not if we just manually changed it)
  useEffect(() => {
    if (url && !manualChangeRef.current) {
      player.replace(url)
    }
    manualChangeRef.current = false
  }, [url, player])

  const playOrPause = () => {
    if (status.playing) {
      player.pause()
    } else {
      player.play()
    }
  }

  const setUrl = (newUrl: string) => {
    manualChangeRef.current = true
    player.replace(newUrl)
    player.play()
  }

  return { player, status, playing, playOrPause, setTrackUrl: setUrl }
}

export default useTrackPlayer
