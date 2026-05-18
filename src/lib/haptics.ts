import {useCallback} from 'react'

import {useHapticsDisabled} from '#/state/preferences/disable-haptics'
import * as Device from '#/shims/device'
import {impactAsync, ImpactFeedbackStyle} from '#/shims/haptics'

export function useHaptics() {
  const isHapticsDisabled = useHapticsDisabled()

  return useCallback(
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      return
    },
    [isHapticsDisabled],
  );
}
