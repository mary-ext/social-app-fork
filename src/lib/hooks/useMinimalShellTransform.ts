import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {interpolate, useAnimatedStyle} from '#/lib/animations/reanimatedCompat'
import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
  const {headerMode} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()
  const {top: topInset} = useSafeAreaInsets()

  const headerPinnedHeight = 0

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.get()
    const hHeight = headerHeight.get()

    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(headerModeValue, [0, 1], [0, -hHeight]),
        },
      ],
    }
  })

  return headerTransform
}

export function useMinimalShellFooterTransform() {
  const {footerMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()

  const footerTransform = useAnimatedStyle(() => {
    const footerModeValue = footerMode.get()
    return {
      pointerEvents: footerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - footerModeValue, 2),
      transform: [
        {
          translateY: interpolate(
            footerModeValue,
            [0, 1],
            [0, footerHeight.get()],
          ),
        },
      ],
    }
  })

  return footerTransform
}

export function useMinimalShellFabTransform() {
  const {footerMode} = useMinimalShellMode()

  const fabTransform = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(footerMode.get(), [0, 1], [-44, 0]),
        },
      ],
    }
  })
  return fabTransform
}
