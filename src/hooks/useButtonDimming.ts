import { useCallback, useEffect, useRef, useState } from 'react'

const BUTTON_DIM_TIME = 4000

export const useButtonDimming = () => {
  const [buttonsDimmed, setButtonsDimmed] = useState(false)
  const dimmerTimerRef = useRef(0)

  const brightenButtons = useCallback(() => {
    clearTimeout(dimmerTimerRef.current)
    setButtonsDimmed(false)
  }, [])

  const dimButtons = useCallback(() => {
    clearTimeout(dimmerTimerRef.current)
    setButtonsDimmed(true)
  }, [])

  const brightenThenFade = useCallback(() => {
    brightenButtons()
    // @ts-ignore
    dimmerTimerRef.current = setTimeout(() => {
      setButtonsDimmed(true)
    }, BUTTON_DIM_TIME)
  }, [brightenButtons])

  useEffect(() => {
    brightenThenFade()
    return () => clearTimeout(dimmerTimerRef.current)
  }, [brightenThenFade])

  return {
    buttonsDimmed,
    brightenButtons,
    dimButtons,
    brightenThenFade,
  }
}
