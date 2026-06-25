# `@base-ui/react` patch notes

rationale for each hunk in `@base-ui__react.patch`. keep this in sync when the patch changes, and
re-evaluate every hunk on an `@base-ui/react` upgrade — line offsets and the surrounding code may
have shifted, and upstream may have fixed the issue.

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
search calendar (`src/components/web/SearchAutocomplete`) needs to drive it: open with today (or the
first of a partially-typed month) highlighted, and roll the highlight across months at the grid
edges via sentinel cells. the store already has `setIndices`; this just surfaces it through the
`actionsRef` the consumer already passes. re-check on upgrade — if upstream adds a first-class
highlighted-index API, drop this hunk for it.

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
(`src/components/web/SearchAutocomplete`) needs `actionsRef` for the calendar but has no reason to
own unmount timing — without this, the popup's `mounted` never flips false and the suggestions
linger in the DOM after every blur/escape/outside-press. `autoUnmount` restores the automatic
unmount (which already awaits the close transition via `useAnimationsFinished`, so a future CSS exit
animation still works) while keeping the imperative handle. re-check on upgrade — if upstream
decouples the auto-unmount from `actionsRef`, drop this hunk for it.
