import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'
import { useCallback, useEffect } from 'react'

// enable playback in silent mode
setAudioModeAsync({ playsInSilentMode: true })

// Static mapping of note names to their audio files
// prettier-ignore
const noteAudioMap: Record<string, any> = {
  'aflat': require('../assets/audio/aflat.mp3'),
  'anatural': require('../assets/audio/anatural.mp3'),
  'bflat': require('../assets/audio/bflat.mp3'),
  'bnatural': require('../assets/audio/bnatural.mp3'),
  'cflat': require('../assets/audio/bnatural.mp3'),
  'cnatural': require('../assets/audio/cnatural.mp3'),
  'dflat': require('../assets/audio/dflat.mp3'),
  'dnatural': require('../assets/audio/dnatural.mp3'),
  'eflat': require('../assets/audio/eflat.mp3'),
  'enatural': require('../assets/audio/enatural.mp3'),
  'fnatural': require('../assets/audio/fnatural.mp3'),
  'gflat': require('../assets/audio/gflat.mp3'),
  'gnatural': require('../assets/audio/gnatural.mp3'),
}

// canonical names have flats
const Aliases = new Map<string, string>([
  ['csharp', 'dflat'],
  ['dsharp', 'eflat'],
  ['fsharp', 'gflat'],
  ['gsharp', 'aflat'],
  ['asharp', 'bflat'],
])

function getNoteName(note: string): string | undefined {
  if (!note) {
    return undefined
  }
  const n = note.toLowerCase()
  switch (n.length) {
    case 0:
      return undefined
    case 1:
      return n + 'natural'
    case 2:
      let sharpFlat = ''
      switch (n[1]) {
        case 'b':
          sharpFlat = n[0] + 'flat'
          break
        case '#':
          sharpFlat = n[0] + 'sharp'
          break
        default:
          return undefined
      }
      return Aliases.get(sharpFlat) || sharpFlat
    default:
      return undefined
  }
}

export function noteForKey(key: string | undefined) {
  return key ? key.split(':')[1] : 'F'
}

type NotePlayerHook = {
  onPressIn: () => void
  onPressOut: () => void
}

export function useNotePlayer(note: string): NotePlayerHook {
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  const noteName = getNoteName(note)
  const audioSource = noteName ? noteAudioMap[noteName] : undefined

  // Load the audio source when the note changes
  useEffect(() => {
    if (audioSource) {
      player.replace(audioSource)
    }
  }, [audioSource, player])

  const stopSound = useCallback(() => {
    console.log(`useNotePlayer.stopSound ${note}`)
    player.pause()
  }, [player, note])

  const playSound = useCallback(() => {
    if (status.playing) {
      console.log(`useNotePlayer.playSound ${note} - already playing, skipping`)
      return
    }
    console.log(`useNotePlayer.playSound ${note}`)
    player.seekTo(0) // Reset to beginning
    player.play()
  }, [player, status.playing, note])

  const onPressIn = useCallback(() => {
    playSound()
  }, [playSound])

  const onPressOut = useCallback(() => {
    stopSound()
  }, [stopSound])

  return { onPressIn, onPressOut }
}
