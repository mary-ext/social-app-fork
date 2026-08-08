# `@base-ui/react` patch notes

## `utils/InternalBackdrop.mjs` — drop the `cutout` clip-path

removes the branch that punches a polygon hole in the internal backdrop around a `cutout` element.
the fork does not use the cutout feature, and the per-frame `getBoundingClientRect` + `clipPath`
recompute is dead cost.

## `utils/popups/popupStoreUtils.mjs` — drop the mid-registration trigger claim

deletes the `if (activeTriggerId == null && open)` block in `useTriggerDataForwarding`. upstream
uses it so that when a popup is already open with no active trigger, the first detached trigger to
register claims the open instance (for focus/ARIA) and forwards its `payload` into the store.

that hijacks a handle shared between an imperative `openWithPayload` open and many unrelated
detached triggers. the global image lightbox is exactly this shape: opened imperatively from a
profile avatar/banner (no trigger), while a feed of post-image `Dialog.Trigger`s share the same
handle. if the avatar lightbox is opened before the feed finishes loading, the first post-image
trigger to mount claims the open instance — which then flips `isMountedByTrigger`
(`activeTriggerId === triggerId && mounted`) true for it, so the layout-effect path forwards its
`payload` too — and the displayed image silently swaps to the first post's image.

removing the block is safe because `useImplicitActiveTrigger` (run by every popup `Root`) already
auto-claims the sole trigger of a single-trigger handle, guarded by `triggerCount === 1` and
evaluated after the commit settles. so the legitimate single-trigger race stays covered, while a
multi-trigger handle is simply left with no active trigger (focus returns to the document rather
than to an unrelated trigger).

## `combobox/root/AriaCombobox.mjs` + `autocomplete/root/AutocompleteRoot.d.mts` — expose `setActiveIndex` on `actionsRef`

adds `setActiveIndex(index)` to the imperative handle built in `AriaCombobox` (alongside `unmount`),
delegating to the existing internal `setIndices({ activeIndex, type: 'none' })`, and declares it on
`AutocompleteRootActions`.

Base UI Autocomplete owns the highlighted index and exposes no controlled/imperative way to set it
(`onItemHighlighted` only observes; `autoHighlight` only targets the first item). the right-rail
search calendar (`src/components/SearchAutocomplete`) needs to drive it: open with today (or the
first of a partially-typed month) highlighted, and roll the highlight across months at the grid
edges via sentinel cells. the store already has `setIndices`; this just surfaces it through the
`actionsRef` the consumer already passes.

## `dialog/root/useRenderDialogRoot.mjs` + `popover/root/PopoverRoot.mjs` + `drawer/root/DrawerRoot.mjs` — `CloseWatcher` for the Android back gesture

registers a `CloseWatcher` on the topmost open dialog/alert-dialog/popover/drawer so the Android
back gesture (Chromium-only) closes it, calling `store.setOpen(false, …)` with the `close-watcher`
reason. Android-only (`platform.os.android`) to avoid clashing with the desktop Escape/nesting that
`useDismiss` owns.

upstream shipped this only in the drawer (`DrawerProviderReporter`); we moved it to
`useRenderDialogRoot` — the shared path for `Dialog.Root`, `AlertDialog.Root`, and `Drawer.Root` —
and deleted the drawer's copy, along with the three imports and the `nestedOpenDialogCount` /
`popupElement` reads that only it used. topmost is `nestedOpenDialogCount === 0`.

popovers have no nested-open count, so `PopoverRoot` gates on `!nested` (only a root popover
registers). `PopoverRoot` no longer derives `nested` itself — the value now goes into `PopoverStore`
at construction and is not readable from state — so the patch restores the
`useFloatingParentNodeId() != null` call that used to live there.

no `.d.mts` changes.

## `combobox/root/AriaCombobox.mjs` + `combobox/root/AriaCombobox.d.mts` — add an `autoUnmount` opt-out

changes the `useOpenChangeComplete` gate from `enabled: !props.actionsRef` to
`enabled: !props.actionsRef || props.autoUnmount === true`, and declares the `autoUnmount?: boolean`
prop on `ComboboxRootProps` (so it flows to `AutocompleteRoot` via the shared props type).
`autoUnmount` only does anything when `actionsRef` is set — without it the popup always
auto-unmounts (and `=== true` keeps `enabled` a boolean, since `useOpenChangeComplete` defaults a
missing `enabled` to `true`).

upstream couples two unrelated concerns: passing `actionsRef` (the only way to reach the
`setActiveIndex` handle above) also opts out of the built-in unmount-on-close, handing the consumer
the contract to call `actions.unmount()` after its own exit animation. the right-rail search
(`src/components/SearchAutocomplete`) needs `actionsRef` for the calendar but has no reason to own
unmount timing — without this, the popup's `mounted` never flips false and the suggestions linger in
the DOM after every blur/escape/outside-press. `autoUnmount` restores the automatic unmount (which
already awaits the close transition via `useAnimationsFinished`, so a future CSS exit animation
still works) while keeping the imperative handle.

## `slider/control/SliderControl.mjs` — make touch gestures commit

two ways a touch gesture ends without `onValueCommitted`. `handleTouchEnd` is its only caller, and
it commits only when `currentInteractionValueRef` is set.

**a tap.** `pointerdown` and the native `touchstart` handler both fire on touch and both run
`startPressing`, which nulls that ref; the second one's `setValue` is then a no-op, because
`pointerdown` already applied the value, so the ref stays null. `handleTouchStart` now skips the
press when the ref is already set, while still attaching the document listeners. drags escape this
because later moves re-set the ref, and a mouse escapes it because there is no `touchstart`.

**a cancelled gesture.** `handleTouchEnd` is bound to `pointerup`/`touchend` only, so a
`pointercancel`/`touchcancel` — Android Chrome collapsing the url bar mid-drag, long-press, palm
rejection — leaves the slider mid-drag, with `dragging` stuck true and the document move listeners
attached. upstream's net in `handleTouchMove` (a later `pointermove` with `buttons === 0`) needs a
move that a cancelled finger never sends. both cancel events are now bound, and unbound in
`stopListening`.

either one froze the video seekbar at the press position while playback continued, since
`Scrubber.tsx` only clears `seekPosition` from `onValueCommitted`.
