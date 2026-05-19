import {Children} from 'react'
import {
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native'
import createEmojiRegex from 'emoji-regex'

import {type Alf, applyFonts, atoms, flatten} from '#/alf'

/**
 * Ensures that `lineHeight` defaults to a relative value of `1`, or applies
 * other relative leading atoms.
 *
 * If the `lineHeight` value is > 2, we assume it's an absolute value and
 * returns it as-is.
 */
export function normalizeTextStyles(
  styles: StyleProp<TextStyle>,
  {
    fontScale,
    fontFamily,
  }: {
    fontScale: number
    fontFamily: Alf['fonts']['family']
  } & Pick<Alf, 'flags'>,
) {
  const s = flatten(styles) ?? {}

  // should always be defined on these components
  s.fontSize = (s.fontSize || atoms.text_md.fontSize) * fontScale

  if (s?.lineHeight) {
    if (s.lineHeight !== 0 && s.lineHeight <= 2) {
      s.lineHeight = Math.round(s.fontSize * s.lineHeight)
    }
  } else {
    s.lineHeight = s.fontSize
  }

  applyFonts(s, fontFamily)

  return s
}

export type StringChild = string | (string | null)[]
export type TextProps = RNTextProps & {
  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean
  /**
   * Provides `data-*` attributes to the underlying text element on web only.
   */
  dataSet?: Record<string, string | number | undefined>
  /**
   * Appears as a small tooltip on web hover.
   */
  title?: string
  /**
   * Whether the children could possibly contain emoji.
   */
  emoji?: boolean
}

export function childHasEmoji(children: React.ReactNode) {
  let hasEmoji = false
  Children.forEach(children, child => {
    if (typeof child === 'string' && createEmojiRegex().test(child)) {
      hasEmoji = true
    }
  })
  return hasEmoji
}

export function renderChildrenWithEmoji(
  children: React.ReactNode,
  _props: Omit<TextProps, 'children'> = {},
  _emoji = false,
) {
  return children
}

const SINGLE_EMOJI_RE =
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+$/u
export function isOnlyEmoji(text: string) {
  return text.length <= 15 && SINGLE_EMOJI_RE.test(text)
}
