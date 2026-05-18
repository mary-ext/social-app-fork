import {useCallback, useEffect} from 'react'
import {type NativeScrollEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {EventEmitter} from 'eventemitter3'

import {
  clamp,
  interpolate,
  useSharedValue,
  withSpring,
} from '#/lib/animations/reanimatedCompat'
import {ScrollProvider} from '#/lib/ScrollContext'
import {useMinimalShellMode} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'

const WEB_HIDE_SHELL_THRESHOLD = 200

export function MainScrollProvider({children}: {children: React.ReactNode}) {
  const {headerHeight} = useShellLayout()
  const {headerMode} = useMinimalShellMode()
  const {top: topInset} = useSafeAreaInsets()
  const headerPinnedHeight = 0
  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)
  const didJustRestoreScroll = useSharedValue<boolean>(false)

  const setMode = useCallback(
    (v: boolean) => {
      'worklet'
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
    },
    [headerMode],
  )

  useEffect(() => {
    return listenToForcedWindowScroll(() => {
      startDragOffset.set(null)
      startMode.set(null)
      didJustRestoreScroll.set(true)
    })
  })

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      const offsetY = Math.max(0, e.contentOffset.y)
    },
    [startDragOffset, startMode, setMode, headerMode, headerHeight],
  )

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      const offsetY = Math.max(0, e.contentOffset.y)
    },
    [headerMode, startDragOffset, startMode],
  )

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
    },
    [snapToClosestState],
  )

  const onMomentumEnd = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
    },
    [snapToClosestState],
  )

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      const offsetY = Math.max(0, e.contentOffset.y)
      if (didJustRestoreScroll.get()) {
        didJustRestoreScroll.set(false)
        // Don't hide/show navbar based on scroll restoratoin.
        return
      }
      // On the web, we don't try to follow the drag because we don't know when it ends.
      // Instead, show/hide immediately based on whether we're scrolling up or down.
      const dy = offsetY - (startDragOffset.get() ?? 0)
      startDragOffset.set(offsetY)

      if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
        setMode(false)
      } else if (dy > 0) {
        setMode(true)
      }
    },
    [
      headerHeight,
      headerPinnedHeight,
      headerMode,
      setMode,
      startDragOffset,
      startMode,
      didJustRestoreScroll,
    ],
  )

  return (
    <ScrollProvider
      onBeginDrag={onBeginDrag}
      onEndDrag={onEndDrag}
      onScroll={onScroll}
      onMomentumEnd={onMomentumEnd}>
      {children}
    </ScrollProvider>
  )
}

const emitter = new EventEmitter()

const originalScroll = window.scroll
window.scroll = function () {
  emitter.emit('forced-scroll')
  return originalScroll.apply(this, arguments as any)
}

const originalScrollTo = window.scrollTo
window.scrollTo = function () {
  emitter.emit('forced-scroll')
  return originalScrollTo.apply(this, arguments as any)
}

function listenToForcedWindowScroll(listener: () => void) {
  emitter.addListener('forced-scroll', listener)
  return () => {
    emitter.removeListener('forced-scroll', listener)
  }
}
