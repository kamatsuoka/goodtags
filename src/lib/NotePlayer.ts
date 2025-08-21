import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio'

// enable playback in silent mode
setAudioModeAsync({ playsInSilentMode: true })

class RampDownParams {
  delay: number
  increment: number

  constructor(
    readonly totalTime: number,
    readonly divs: number,
  ) {
    this.delay = totalTime / divs
    this.increment = 1.0 / divs
  }
}

const RampDown = new RampDownParams(300, 30)

/**
 * Plays a musical note.
 */
export class NotePlayer {
  note: string
  player: AudioPlayer
  playing: boolean = false
  timeoutId: ReturnType<typeof setTimeout> | undefined = undefined

  constructor(note: string, player: AudioPlayer) {
    this.note = note
    this.player = player
  }

  startRampDown = () => {
    if (this.playing) {
      if (this.timeoutId) {
        this.stopSound()
      } else {
        this.rampDown()
      }
    }
  }

  private rampDown = () => {
    if (this.playing) {
      const volume = this.player.volume
      if (volume > 0.1) {
        const newVolume = Math.max(0.0, volume * 0.75)
        this.player.volume = newVolume
        this.timeoutId = setTimeout(this.rampDown, RampDown.delay)
      } else {
        this.stopSound()
      }
    }
  }

  playSound = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.player.volume = 1.0
    console.log('NotePlayer.playSound')
    this.player.seekTo(0) // Reset to beginning
    this.player.play()
    stopOthers(this.note)
    this.playing = true
  }

  stopSound = () => {
    console.log('NotePlayer.stopSound')
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
    this.player.pause()
    this.playing = false
  }
}

function stopOthers(note: string) {
  NotePlayers.forEach((notePlayer, otherNote) => {
    if (otherNote !== note) {
      notePlayer.stopSound()
    }
  })
}

const NotePlayers = new Map<string, NotePlayer>()

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

export function getNotePlayer(note: string): NotePlayer | undefined {
  const noteName = getNoteName(note)
  if (noteName) {
    let player = NotePlayers.get(noteName)
    if (!player) {
      const audioPlayer = createNotePlayer(noteName)
      player = new NotePlayer(noteName, audioPlayer)
      NotePlayers.set(noteName, player)
    }
    return player
  }
  return undefined
}

// Static mapping of note names to their audio files
// prettier-ignore
const noteAudioMap: Record<string, any> = {
  'aflat': require('../../ios/notes/aflat.mp3'),
  'anatural': require('../../ios/notes/anatural.mp3'),
  'bflat': require('../../ios/notes/bflat.mp3'),
  'bnatural': require('../../ios/notes/bnatural.mp3'),
  'cnatural': require('../../ios/notes/cnatural.mp3'),
  'dflat': require('../../ios/notes/dflat.mp3'),
  'dnatural': require('../../ios/notes/dnatural.mp3'),
  'eflat': require('../../ios/notes/eflat.mp3'),
  'enatural': require('../../ios/notes/enatural.mp3'),
  'fnatural': require('../../ios/notes/fnatural.mp3'),
  'gflat': require('../../ios/notes/gflat.mp3'),
  'gnatural': require('../../ios/notes/gnatural.mp3'),
}

export function noteForKey(key: string) {
  return key ? key.split(':')[1] : 'F'
}

function createNotePlayer(noteName: string): AudioPlayer {
  // Get audio source from static mapping
  const audioSource = noteAudioMap[noteName]
  if (!audioSource) {
    throw new Error(`Audio file not found for note: ${noteName}`)
  }
  const player = createAudioPlayer(audioSource)
  return player
}
