import {
  AudioPlayer,
  AudioStatus,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'

type TrackPlayerHook = {
  player: AudioPlayer
  status: AudioStatus
  playing: boolean
  playOrPause: () => void
  setUrl: (newUrl: string) => void
}

export function useTrackPlayer(url?: string): TrackPlayerHook {
  const player = useAudioPlayer(url)
  const status = useAudioPlayerStatus(player)
  const playing = status.playing

  const playOrPause = () => {
    if (status.playing) {
      player.pause()
    } else {
      player.play()
    }
  }

  const setUrl = (newUrl: string) => {
    player.replace(newUrl)
    player.play()
  }

  return { player, status, playing, playOrPause, setUrl }
}

export default useTrackPlayer
