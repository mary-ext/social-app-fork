# `@base-ui/react` patch notes

## `utils/popups/popupStoreUtils.mjs`: drop the mid-registration trigger claim

prevents the first detached trigger registered during an imperative open from claiming the popup and
replacing its payload. this matters for the image lightbox, whose handle is shared by imperative
openers and many post-image `Dialog.Trigger`s.

`useImplicitActiveTrigger` still claims a trigger when exactly one is registered. an imperative open
on a multi-trigger handle remains unowned rather than associating it with an unrelated trigger.

## `dialog/root/useRenderDialogRoot.mjs`: `CloseWatcher` for the Android back gesture

adds a `CloseWatcher` to the dialog root so Android back gestures dismiss dialogs and alert dialogs.
only dialogs without an open nested dialog register; desktop dismissal uses `useDismiss`.

canceled close requests recreate the one-shot watcher, allowing repeated back gestures to navigate
within a dialog.

## `slider/control/SliderControl.mjs`: make touch gestures commit

touch emits both `pointerdown` and `touchstart`. the native touch handler now preserves the
interaction value established by the pointer handler so a tap reaches `onValueCommitted`.

`pointercancel` and `touchcancel` now use the normal end handler, committing the current value and
clearing drag state and document listeners. the video scrubber relies on `onValueCommitted` to leave
its seeking state.
