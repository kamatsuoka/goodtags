import Sound from "react-native-sound"

// enable playback in silent mode
Sound.setCategory("Playback")

class RampDownParams {
  delay: number
  increment: number

  constructor(readonly totalTime: number, readonly divs: number) {
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
  sound: Sound
  playing: boolean = false
  timeoutId: number | undefined = undefined

  constructor(note: string, sound: Sound) {
    this.note = note
    this.sound = sound
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
      const volume = this.sound.getVolume()
      if (volume > 0.1) {
        const newVolume = Math.max(0.0, volume * 0.75)
        this.sound.setVolume(newVolume)
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
    this.sound.setVolume(1.0)
    console.log("NotePlayer.playSound")
    this.sound.play(() => {
      // we got to the end
      this.stopSound()
    })
    stopOthers(this.note)
    this.playing = true
  }

  stopSound = () => {
    console.log("NotePlayer.stopSound")
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
    this.sound.stop()
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
  ["csharp", "dflat"],
  ["dsharp", "eflat"],
  ["fsharp", "gflat"],
  ["gsharp", "aflat"],
  ["asharp", "bflat"],
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
      return n + "natural"
    case 2:
      let sharpFlat = ""
      switch (n[1]) {
        case "b":
          sharpFlat = n[0] + "flat"
          break
        case "#":
          sharpFlat = n[0] + "sharp"
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
    const sound = createSound(noteName)
    return new NotePlayer(noteName, sound)
  }
  return undefined
}

function createSound(noteName: string) {
  const sound = new Sound(
    noteName + ".mp3",
    Sound.MAIN_BUNDLE,
    (error: any) => {
      if (error) {
        console.log(`${error}`)
      }
    },
  )
  sound.setNumberOfLoops(0)
  return sound
}

export function noteForKey(key: string) {
  return key ? key.split(":")[1] : "F"
}
