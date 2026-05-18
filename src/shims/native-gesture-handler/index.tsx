import {createElement, forwardRef, Fragment, type ReactNode} from 'react'
import {View, type ViewProps} from 'react-native'

/*
 * Long-lived web adapter for native gesture handlers.
 *
 * Web gesture handling in this fork is implemented by ordinary pointer,
 * scroll, and press handlers. This shim keeps native-only gesture builder
 * callsites type-safe while removing the RNGH package from the web bundle.
 */

type GestureCallback<Event> = (event: Event) => void

type GestureEventPayload = {
  absoluteX: number
  absoluteY: number
  focalX: number
  focalY: number
  scale: number
  translationX: number
  translationY: number
  velocityX: number
  velocityY: number
  x: number
  y: number
}

export type PanGestureHandlerEventPayload = GestureEventPayload
export type GestureStateChangeEvent<Payload = GestureEventPayload> = Payload
export type GestureUpdateEvent<Payload = GestureEventPayload> = Payload

export type NativeGesture = GestureChain
export type PanGesture = GestureChain
export type PinchGesture = GestureChain
export type TapGesture = GestureChain
export type LongPressGesture = GestureChain

class GestureChain {
  activeOffsetX(_value: number | [number, number]) {
    return this
  }
  activeOffsetY(_value: number | [number, number]) {
    return this
  }
  activateAfterLongPress(_value: number) {
    return this
  }
  averageTouches(_value: boolean) {
    return this
  }
  blocksExternalGesture(..._gestures: unknown[]) {
    return this
  }
  cancelsTouchesInView(_value: boolean) {
    return this
  }
  direction(_value: unknown) {
    return this
  }
  enabled(_value: boolean) {
    return this
  }
  failOffsetX(_value: number | [number, number]) {
    return this
  }
  failOffsetY(_value: number | [number, number]) {
    return this
  }
  hitSlop(_value: unknown) {
    return this
  }
  manualActivation(_value: boolean) {
    return this
  }
  maxDuration(_value: number) {
    return this
  }
  maxPointers(_value: number) {
    return this
  }
  minDistance(_value: number) {
    return this
  }
  minPointers(_value: number) {
    return this
  }
  numberOfTaps(_value: number) {
    return this
  }
  onBegin(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onChange(_handler: GestureCallback<GestureUpdateEvent>) {
    return this
  }
  onEnd(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onFinalize(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onStart(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onTouchesCancelled(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onTouchesDown(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onTouchesMove(_handler: GestureCallback<GestureUpdateEvent>) {
    return this
  }
  onTouchesUp(_handler: GestureCallback<GestureStateChangeEvent>) {
    return this
  }
  onUpdate(_handler: GestureCallback<GestureUpdateEvent>) {
    return this
  }
  requireExternalGestureToFail(..._gestures: unknown[]) {
    return this
  }
  runOnJS(_value: boolean) {
    return this
  }
  shouldCancelWhenOutside(_value: boolean) {
    return this
  }
  simultaneousWithExternalGesture(..._gestures: unknown[]) {
    return this
  }
}

function createGesture() {
  return new GestureChain()
}

export const Gesture = {
  Exclusive: (..._gestures: unknown[]) => createGesture(),
  Fling: createGesture,
  LongPress: createGesture,
  Manual: createGesture,
  Native: createGesture,
  Pan: createGesture,
  Pinch: createGesture,
  Race: (..._gestures: unknown[]) => createGesture(),
  Simultaneous: (..._gestures: unknown[]) => createGesture(),
  Tap: createGesture,
}

export const Directions = {
  DOWN: 2,
  LEFT: 4,
  RIGHT: 8,
  UP: 1,
} as const

export const State = {
  ACTIVE: 4,
  BEGAN: 2,
  CANCELLED: 3,
  END: 5,
  FAILED: 1,
  UNDETERMINED: 0,
} as const

export function GestureDetector({
  children,
  gesture,
}: {
  children?: ReactNode
  gesture: unknown
}) {
  void gesture
  return createElement(Fragment, null, children)
}

export const GestureHandlerRootView = forwardRef<View, ViewProps>(
  function GestureHandlerRootView(props, ref) {
    return createElement(View, {...props, ref})
  },
)
