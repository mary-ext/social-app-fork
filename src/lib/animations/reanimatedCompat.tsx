import {type ComponentType,createElement, forwardRef} from 'react'
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'

type AnimationConfig = {
  name: string
  durationMs?: number
  delayMs?: number
  easingValue?: string
}

type AnimatedProp = AnimationBuilder | AnimationConfig | undefined

type AnimatedCompatProps = {
  entering?: AnimatedProp
  exiting?: AnimatedProp
  layout?: AnimatedProp
}

export type AnimationBuilder = AnimationConfig & {
  delay: (ms: number) => AnimationBuilder
  duration: (ms: number) => AnimationBuilder
  easing: (value: string) => AnimationBuilder
  springify: () => AnimationBuilder
  damping: () => AnimationBuilder
  stiffness: () => AnimationBuilder
}

function createAnimation(config: AnimationConfig): AnimationBuilder {
  return {
    ...config,
    delay: ms => createAnimation({...config, delayMs: ms}),
    duration: ms => createAnimation({...config, durationMs: ms}),
    easing: value => createAnimation({...config, easingValue: value}),
    springify: () => createAnimation({...config, easingValue: 'ease-out'}),
    damping: () => createAnimation(config),
    stiffness: () => createAnimation(config),
  }
}

function stripAnimationProps<P extends object>(
  props: P & AnimatedCompatProps,
): P {
  const {entering, exiting, layout, ...rest} = props
  void entering
  void exiting
  void layout
  return rest as P
}

function createAnimatedComponent<P extends object>(
  Component: ComponentType<P>,
) {
  return forwardRef<unknown, P & AnimatedCompatProps>(
    function AnimatedCompatComponent(props, ref) {
      return createElement(Component, {...stripAnimationProps(props), ref} as P)
    },
  )
}

export const Easing = {
  linear: 'linear',
  ease: 'ease',
  exp: 'ease-out',
  cubic: 'ease-out',
  out: (value: string) => value,
  in: (value: string) => value,
  inOut: (value: string) => value,
  bezier: (x1: number, y1: number, x2: number, y2: number) =>
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
}

export const FadeIn = createAnimation({name: 'fade-in'})
export const FadeOut = createAnimation({name: 'fade-out'})
export const FadeInDown = createAnimation({name: 'fade-in-down'})
export const FadeOutDown = createAnimation({name: 'fade-out-down'})
export const FadeInLeft = createAnimation({name: 'fade-in-left'})
export const FadeOutLeft = createAnimation({name: 'fade-out-left'})
export const FadeInRight = createAnimation({name: 'fade-in-right'})
export const FadeOutRight = createAnimation({name: 'fade-out-right'})
export const FadeInUp = createAnimation({name: 'fade-in-up'})
export const FadeOutUp = createAnimation({name: 'fade-out-up'})
export const SlideInLeft = createAnimation({name: 'slide-in-left'})
export const SlideInRight = createAnimation({name: 'slide-in-right'})
export const SlideInUp = createAnimation({name: 'slide-in-up'})
export const SlideInDown = createAnimation({name: 'slide-in-down'})
export const SlideOutLeft = createAnimation({name: 'slide-out-left'})
export const SlideOutRight = createAnimation({name: 'slide-out-right'})
export const SlideOutUp = createAnimation({name: 'slide-out-up'})
export const SlideOutDown = createAnimation({name: 'slide-out-down'})
export const ZoomIn = createAnimation({name: 'zoom-in'})
export const ZoomOut = createAnimation({name: 'zoom-out'})
export const ZoomInDown = createAnimation({name: 'zoom-in-down'})
export const ZoomOutDown = createAnimation({name: 'zoom-out-down'})
export const ZoomInLeft = createAnimation({name: 'zoom-in-left'})
export const ZoomOutLeft = createAnimation({name: 'zoom-out-left'})
export const ZoomInRight = createAnimation({name: 'zoom-in-right'})
export const ZoomOutRight = createAnimation({name: 'zoom-out-right'})
export const ZoomInUp = createAnimation({name: 'zoom-in-up'})
export const ZoomOutUp = createAnimation({name: 'zoom-out-up'})
export const LinearTransition = createAnimation({name: 'linear-transition'})

export function LayoutAnimationConfig({
  children,
  skipEntering,
  skipExiting,
}: {
  children: React.ReactNode
  skipEntering?: boolean
  skipExiting?: boolean
}) {
  void skipEntering
  void skipExiting
  return children
}

export function useReducedMotion() {
  return false
}

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  Image: createAnimatedComponent(Image),
  ScrollView: createAnimatedComponent(ScrollView),
  FlatList: createAnimatedComponent(FlatList),
  Pressable: createAnimatedComponent(Pressable),
  createAnimatedComponent,
}

export default Animated
