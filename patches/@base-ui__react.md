# `@base-ui/react` patch notes

## `utils/InternalBackdrop.mjs`: drop the `cutout` clip-path

removes the hole around the trigger in an anchored popup's internal backdrop. the backdrop now
intercepts trigger presses like any other outside press instead of leaving the trigger interactive.

the positioners supply `cutout`, so this affects root `Menu` and `Select` instances and modal
`Combobox` and `Popover` instances. `Dialog` does not supply a cutout.

## `utils/popups/popupStoreUtils.mjs`: drop the mid-registration trigger claim

prevents the first detached trigger registered during an imperative open from claiming the popup and
replacing its payload. this matters for the image lightbox, whose handle is shared by imperative
openers and many post-image `Dialog.Trigger`s.

`useImplicitActiveTrigger` still claims a trigger when exactly one is registered. an imperative open
on a multi-trigger handle remains unowned rather than associating it with an unrelated trigger.

## `combobox/root/AriaCombobox.mjs` + `autocomplete/root/AutocompleteRoot.d.mts`: expose `setActiveIndex` on `actionsRef`

adds `setActiveIndex(index)` to the autocomplete imperative actions. `SearchAutocomplete` uses it to
set the calendar's initial highlight, continue keyboard navigation across month boundaries, and
highlight touch or pen targets before an item press.

## `dialog/root/useRenderDialogRoot.mjs` + `popover/root/PopoverRoot.mjs` + `drawer/root/DrawerRoot.mjs`: `CloseWatcher` for the Android back gesture

moves the drawer's Android `CloseWatcher` into the shared dialog root, extending back-gesture
dismissal to dialogs and alert dialogs, and adds the same behavior to non-nested popovers. a dialog
registers only when it has no open nested dialog. the change remains Android-only so desktop
dismissal continues through `useDismiss`.

## `combobox/root/AriaCombobox.mjs` + `combobox/root/AriaCombobox.d.mts`: allow automatic unmounting with `actionsRef`

passing `actionsRef` normally opts into manual unmounting after a closing animation. `autoUnmount`
keeps Base UI's automatic transition-aware unmounting while still exposing imperative actions.
`SearchAutocomplete` needs this because it uses `setActiveIndex` but does not manage popup
animations or call `actions.unmount()`.

## `slider/control/SliderControl.mjs`: make touch gestures commit

touch emits both `pointerdown` and `touchstart`. the native touch handler now preserves the
interaction value established by the pointer handler so a tap reaches `onValueCommitted`.

`pointercancel` and `touchcancel` now use the normal end handler, committing the current value and
clearing drag state and document listeners. the video scrubber relies on `onValueCommitted` to leave
its seeking state.

## `utils/useAnchoredPopupScrollLock.mjs`: always lock scroll, including touch opens

locks the page whenever an anchored popup requests scroll locking, including touch opens. without
this, the modal backdrop blocks outside taps while the page can still scroll beneath the popup.

this affects `Menu`, `Select`, `Combobox`, and `Popover`.
