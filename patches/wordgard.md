# `wordgard` patch notes

## `dist/editor.js`: limit `PointIterator.goto`'s skip loop to `pos`

when an update section excludes its start, skips only widgets at `pos`, which the previous section
already emitted. the loop previously skipped later widgets too, until a node decoration or the end
of the point set.

with the former in-editor headers, deleting the active post triggered this bug: the following post's
active attribute began a second update section, which skipped its header widget at `pos + 1`.

## `dist/state.js`: drop the `@__PURE__` annotation on `initField`

Terser's `collapse_vars` folds the preceding `GardState` namespace assignment into this call;
`unused` then drops both, leaving the namespace undefined in production builds.

## `dist/doc.d.ts`: type `Pos.Node` sibling getters as document nodes

`nextSibling` and `previousSibling` return document nodes, not `Pos.Node` wrappers. correct their
return types and swapped descriptions.
