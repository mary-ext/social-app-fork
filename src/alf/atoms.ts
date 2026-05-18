import {type StyleProp, type ViewStyle} from 'react-native'

import {CARD_ASPECT_RATIO} from '#/lib/constants'
import {atoms as baseAtoms} from '#/alf/base'
import * as Layout from '#/components/Layout'

const EXP_CURVE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const atoms = {
  ...baseAtoms,

  h_full_vh: {
    height: '100vh',
  } as any,

  /**
   * Used for the outermost components on screens, to ensure that they can fill
   * the screen and extend beyond.
   */
  util_screen_outer: [
    {
      minHeight: '100dvh',
    } as any,
    undefined as any,
  ] as StyleProp<ViewStyle>,

  /*
   * Theme-independent bg colors
   */
  bg_transparent: {
    backgroundColor: 'transparent',
  },

  /**
   * Aspect ratios
   */
  aspect_square: {
    aspectRatio: 1,
  },
  aspect_card: {
    aspectRatio: CARD_ASPECT_RATIO,
  },

  /*
   * Transition
   */
  transition_none: {
    transitionProperty: 'none',
  } as any,
  transition_timing_default: {
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  } as any,
  transition_all: {
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  } as any,
  transition_color: {
    transitionProperty:
      'color, background-color, border-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  } as any,
  transition_opacity: {
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  } as any,
  transition_transform: {
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  } as any,
  transition_delay_50ms: {
    transitionDelay: '50ms',
  } as any,

  /*
   * Animations
   */
  fade_in: {
    animation: 'fadeIn ease-out 0.15s',
  } as any,
  fade_out: {
    animation: 'fadeOut ease-out 0.15s',
    animationFillMode: 'forwards',
  } as any,
  zoom_in: {
    animation: 'zoomIn ease-out 0.1s',
  } as any,
  zoom_out: {
    animation: 'zoomOut ease-out 0.1s',
  } as any,
  slide_in_left: {
    // exponential easing function
    animation: 'slideInLeft cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
  } as any,
  slide_out_left: {
    animation: 'slideOutLeft ease-in 0.15s',
    animationFillMode: 'forwards',
  } as any,
  // special composite animation for dialogs
  zoom_fade_in: {
    animation: `zoomIn ${EXP_CURVE} 0.3s, fadeIn ${EXP_CURVE} 0.3s`,
  } as any,

  /**
   * Visually hidden but available to screen readers (web).
   * Use for live regions or off-screen labels (e.g. "Image 1 of 3").
   */
  sr_only: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  } as any,

  /**
   * {@link Layout.SCROLLBAR_OFFSET}
   */
  scrollbar_offset: {
    transform: [
      {
        translateX: Layout.SCROLLBAR_OFFSET,
      },
    ],
  } as {transform: Exclude<ViewStyle['transform'], string | undefined>},
} as const
