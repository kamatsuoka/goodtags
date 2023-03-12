/**
 * Canonical note names
 */
export enum NOTE {
  aflat = "aflat",
  anatural = "anatural",
  bflat = "bflat",
  bnatural = "bnatural",
  cnatural = "cnatural",
  dflat = "dflat",
  dnatural = "dnatural",
  eflat = "eflat",
  enatural = "enatural",
  fnatural = "fnatural",
  gflat = "gflat",
  gnatural = "gnatural",
}

const Aliases = new Map<string, string>([
  ["csharp", "dflat"],
  ["dsharp", "eflat"],
  ["fsharp", "gflat"],
  ["gsharp", "aflat"],
  ["asharp", "bflat"],
])

function getNoteWithSharpFlat(keyWithSharpFlat: string): string {
  let note = ""
  switch (keyWithSharpFlat[1]) {
    case "b":
      note = keyWithSharpFlat[0] + "flat"
      break
    case "#":
      note = keyWithSharpFlat[0] + "sharp"
      break
  }
  return Aliases.get(note) || note
}

/**
 * Gets the canonical note name for a key.
 *
 * Input key is raw data from barbershoptags.com xml WritKey,
 * using "b"/"#" for flat/sharp, without mode (Major/Minor).
 *
 * Canonical names use flats instead of sharps, e.g. "dflat" instead of "fsharp",
 * and append "natural" for notes without an accidental.
 *
 * This note name is only for looking up a sound file!
 *
 * @param keyNote key from WritKey, without mode (Major/Minor)
 * @return canonical note name, or f natural if unable to parse keyNote
 */
export function getCanonicalNote(keyNote: string): NOTE {
  const defaultNote = NOTE.fnatural
  if (keyNote) {
    let noteName = "fnatural" // default, since F is most common key
    const n = keyNote.toLowerCase()
    switch (n.length) {
      case 1:
        noteName = n + "natural"
        break
      case 2:
        noteName = getNoteWithSharpFlat(n)
        break
    }
    if (noteName in NOTE) {
      return noteName as NOTE
    }
  }
  return defaultNote
}

/**
 * Gets the key corresponding to the key a tag is in,
 * defaulting to F if not specified.
 *
 * @param writKey WritKey from xml tag data, e.g. Major:G#
 * @return key with mode (Major/Minor) removed, defaulting to F
 */
export function getKey(writKey: string) {
  return writKey ? writKey.split(":")[1] : "F"
}
