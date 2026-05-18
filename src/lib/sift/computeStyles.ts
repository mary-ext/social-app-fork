import {type ViewStyle} from 'react-native'

import {type Placement} from './useSift'

export function computeStyles(
  {
    anchor,
    input,
    popover,
  }: {
    anchor: HTMLElement
    input: HTMLElement
    popover: HTMLElement | null
  },
  options: {
    offset: number
    placement: Placement
    dynamicWidth?: boolean
    insets?: {top: number; bottom: number}
    window: {width: number; height: number}
  },
): ViewStyle | null {
  const anchorRect = anchor.getBoundingClientRect()
  const inputRect = input.getBoundingClientRect()
  const popoverRect = popover?.getBoundingClientRect()

  // If any measurement failed (view not in hierarchy yet), return null
  // so the caller keeps the previous styles.
  if (!anchorRect.width || !inputRect.width) return null
  if (popoverRect && !popoverRect.width && !popoverRect.height) return null

  const popoverWidth = popoverRect?.width ?? 0
  const [side, align] = options.placement.split('-') as [
    string,
    string | undefined,
  ]

  const insetTop = options.insets?.top ?? 0
  const insetBottom = options.insets?.bottom ?? 0

  let top: number | 'auto' = 'auto'
  let bottom: number | 'auto' = 'auto'
  let maxHeight: number | undefined
  if (side === 'top') {
    bottom = options.window.height - anchorRect.top + options.offset
    maxHeight = anchorRect.top - options.offset - insetTop
  } else {
    top = anchorRect.bottom + options.offset
    maxHeight =
      options.window.height - insetBottom - anchorRect.bottom - options.offset
  }

  let left: number
  if (align === 'start') {
    left = anchorRect.left
  } else if (align === 'end') {
    left = anchorRect.right - popoverWidth
  } else {
    left = anchorRect.left + (anchorRect.width - popoverWidth) / 2
  }

  let maxWidth: number | undefined
  if (options.dynamicWidth === false) {
    left = anchorRect.left
    maxWidth = anchorRect.width
  }

  return {
    // @ts-ignore
    position: 'fixed',
    top,
    bottom,
    left,
    maxWidth,
    maxHeight,
  }
}
