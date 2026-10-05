# `wordgard` patch notes

## `dist/editor.js`: limit `PointIterator.goto`'s skip loop to `pos`

when an update section excludes its start, skips only widgets at `pos`, which the previous section
already emitted. the loop previously skipped later widgets too, until a node decoration or the end
of the point set.

deleting a post containing the caret puts the deletion and the following post's active-post
attribute in adjacent update sections. the second section skipped that post's header widget at
`pos + 1`, removing its avatar and handle.

## `dist/editor.js`: keep native selections in post text

on Android, selection handle drags and Gboard's backspace swipe can move the DOM selection into
header/footer widgets or between posts, leaving a horizontal caret or dismissing the keyboard.

`readDOMSelection` uses `GardSelection.near` to normalize the caret or range ends, biased inward for
ranges. if the ends cross, it collapses to the normalized head. `setDOMSelection` preserves DOM
ranges that normalize to the current selection; rewriting them cancels native handle drags.

`readSelectionRange` accepts selections anchored in non-editable widgets while the editor has focus.
`pollSelection` restores the DOM caret even when normalization leaves the state selection unchanged,
since no dispatch would otherwise move it out of the widget.

## `dist/state.js`: drop the `@__PURE__` annotation on `initField`

Terser's `collapse_vars` folds the preceding `GardState` namespace assignment into this call;
`unused` then drops both, leaving the namespace undefined in production builds.

## `dist/doc.d.ts`: type `Pos.Node` sibling getters as document nodes

`nextSibling` and `previousSibling` return document nodes, not `Pos.Node` wrappers. correct their
return types and swapped descriptions.
