# `@base-ui/react` patch notes

rationale for each hunk in `@base-ui__react.patch`. keep this in sync when the patch changes, and
re-evaluate every hunk on an `@base-ui/react` upgrade — line offsets and the surrounding code may
have shifted, and upstream may have fixed the issue.

## `esm/utils/InternalBackdrop.js` — drop the `cutout` clip-path

removes the branch that punches a polygon hole in the internal backdrop around a `cutout` element.
the fork does not use the cutout feature, and the per-frame `getBoundingClientRect` + `clipPath`
recompute is dead cost.

## `esm/utils/popups/popupStoreUtils.js` — drop the mid-registration trigger claim

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
