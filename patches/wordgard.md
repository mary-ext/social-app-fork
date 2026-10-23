# `wordgard` patch notes

## `dist/editor.js`: don't redraw end tag widgets twice in `ContentUpdate.keep`

preserves `includeStart` when redrawing a changed closing token. a preceding range ending just
before that token has already emitted its `end` tag widgets; including the start again duplicated
footer spacers after blank-line post splits.

walks cut positions in document order to match the advancing document cursor.

## `dist/state.js`: drop the `@__PURE__` annotation on `initField`

Terser's `collapse_vars` folds the preceding `GardState` namespace assignment into this call;
`unused` then drops both, leaving the namespace undefined in production builds.
