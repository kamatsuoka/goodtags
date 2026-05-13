import React from 'react'
import { Text as PaperText } from 'react-native-paper'

export const MAX_FONT_SIZE_MULTIPLIER = 1.5

export function Text(props: React.ComponentProps<typeof PaperText>) {
  return <PaperText maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} {...props} />
}
