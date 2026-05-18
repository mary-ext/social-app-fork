import {useEffect, useRef} from 'react'

import {type UseSiftReturn} from './useSift'

export function useKeyboardHandling(props: {
  enabled?: boolean
  sift: UseSiftReturn
  onArrowDown: () => void
  onArrowUp: () => void
  onHome: () => void
  onEnd: () => void
  onSelect: () => void
  onDismiss?: () => void
}) {
  const callbacksRef = useRef(props)
  callbacksRef.current = props

  useEffect(() => {
    const input = props.sift.elements.input
    if (!input) return

    function onKeyDown(e: KeyboardEvent) {
      if (!callbacksRef.current.sift.isActive()) return

      let handled = false

      switch (e.key) {
        case 'ArrowDown':
          handled = true
          callbacksRef.current.onArrowDown()
          break
        case 'ArrowUp':
          handled = true
          callbacksRef.current.onArrowUp()
          break
        case 'Enter':
        case 'Tab':
          handled = true
          callbacksRef.current.onSelect()
          break
        case 'Home':
          handled = true
          callbacksRef.current.onHome()
          break
        case 'End':
          handled = true
          callbacksRef.current.onEnd()
          break
        case 'Escape':
          handled = true
          callbacksRef.current.onDismiss?.()
          break
      }

      if (handled) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    if ('addEventListener' in input) {
      input.addEventListener('keydown', onKeyDown)
    }

    return () => {
      if ('removeEventListener' in input) {
        input.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [props.sift.elements.input])
}
