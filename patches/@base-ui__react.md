# `@base-ui/react` patch notes

## `slider/control/SliderControl.mjs`: make touch gestures commit

touch emits both `pointerdown` and `touchstart`. the native touch handler now preserves the
interaction value established by the pointer handler so a tap reaches `onValueCommitted`.

`pointercancel` and `touchcancel` now use the normal end handler, committing the current value and
clearing drag state and document listeners. the video scrubber relies on `onValueCommitted` to leave
its seeking state.
