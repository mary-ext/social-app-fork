/* eslint-disable @typescript-eslint/no-explicit-any */

import {Platform, type ViewStyle} from 'react-native'

import {type Placement} from './useSift'

type MeasurableNode = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void
}

function measureInWindow(
  node: MeasurableNode,
): Promise<{x: number; y: number; width: number; height: number}> {
  return new Promise(resolve => {
    try {
      node.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          resolve({x, y, width, height})
        },
      )
    } catch {
      resolve({x: 0, y: 0, width: 0, height: 0})
    }
  })
}

export async function computeStyles(
  {
    anchor,
    input,
    popover,
  }: {
    anchor: any
    input: any
    popover: any | null
  },
  options: {
    offset: number
    placement: Placement
    dynamicWidth?: boolean
    insets?: {top: number; bottom: number}
    window: {width: number; height: number}
  },
): Promise<ViewStyle | null> {
  const anchorRect = await measureInWindow(anchor)
  const inputRect = await measureInWindow(input)
  const popoverRect = popover ? await measureInWindow(popover) : null

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
  // android reports measurements minus insets
  const anchorTop =
    Platform.OS === 'android' ? anchorRect.y + insetTop : anchorRect.y

  let top: number | 'auto' = 'auto'
  let bottom: number | 'auto' = 'auto'
  let maxHeight: number | undefined
  if (side === 'top') {
    bottom = options.window.height - anchorTop + options.offset
    maxHeight = anchorRect.y - options.offset - insetTop
  } else {
    top = anchorRect.y + anchorRect.height + options.offset
    maxHeight =
      options.window.height -
      insetBottom -
      (anchorRect.y + anchorRect.height + options.offset)
  }

  let left: number
  if (align === 'start') {
    left = anchorRect.x
  } else if (align === 'end') {
    left = anchorRect.x + anchorRect.width - popoverWidth
  } else {
    left = anchorRect.x + (anchorRect.width - popoverWidth) / 2
  }

  let maxWidth: number | undefined
  if (options.dynamicWidth === false) {
    left = anchorRect.x
    maxWidth = anchorRect.width
  }

  return {
    position: 'absolute',
    top,
    bottom,
    left,
    maxWidth,
    maxHeight,
  }
}
