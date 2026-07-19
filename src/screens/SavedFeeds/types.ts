import type { AppBskyActorDefs } from '@atcute/bluesky';

export type SavedFeed = AppBskyActorDefs.SavedFeed;

/** which of the two lists a feed belongs to. also the discriminant carried by drags and drop targets. */
export type Section = 'pinned' | 'unpinned';

/** the payload a dragged feed carries, letting a drop target reason about where the drag came from. */
export type DragData = { id: string; index: number; section: Section };

/** the payload a drop target attaches via `getData`, surfaced in the monitor's `location`. */
export type DropData = { index: number; section: Section };
