import {useCallback} from 'react'

import {useHapticsDisabled} from '#/state/preferences/disable-haptics'

export function useHaptics() {
  const isHapticsDisabled = useHapticsDisabled()

  return useCallback(
    (_strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      return
    },
    [isHapticsDisabled],
  )
}
