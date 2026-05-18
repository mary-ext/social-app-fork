/* eslint-disable no-misleading-character-class */

// Each regex begins with a `(^|\s|\()` capture group: a backwards-compatible
// alternative to lookbehind (Safari < 16.4 throws on lookbehind at parse time).
// The boundary char is captured into m[1]; util.ts strips it so positions and
// `raw` reflect the facet itself.
export const mention = /(^|\s|\()@([a-zA-Z0-9.-]+)\b/g
export const emoji = /(^|\s|\():([a-zA-Z0-9_]+):/g
export const tag =
  /(^|\s|\()[#＃]((?!\ufe0f)[^\s\u00AD\u2060\u200A\u200B\u200C\u200D\u20e2]*[^\d\s\p{P}\u00AD\u2060\u200A\u200B\u200C\u200D\u20e2]+[^\s\u00AD\u2060\u200A\u200B\u200C\u200D\u20e2\p{P}]*)?/gu
export const url =
  /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/gim
