import {getNotePlayer, NotePlayer} from "./NotePlayer"

/**
 * Action handlers for note button
 */
export class NoteHandler {
  note: string
  player: NotePlayer | undefined

  constructor(note: string) {
    this.note = note
    this.player = getNotePlayer(this.note)
  }

  onPressIn = () => {
    if (this.player) {
      this.player.playSound()
    }
  }
  onPressOut = () => {
    if (this.player) {
      this.player.startRampDown()
    }
  }
}
