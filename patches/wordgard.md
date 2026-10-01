# `wordgard` patch notes

## `dist/editor.js`: limit `PointIterator.goto`'s skip loop to `pos`

when an update section excludes its start, skips only widgets at `pos`, which the previous section
already emitted. the loop previously skipped later widgets too, until a node decoration or the end
of the point set.

deleting a post containing the caret puts the deletion and the following post's active-post
attribute in adjacent update sections. the second section skipped that post's header widget at
`pos + 1`, removing its avatar and handle.
