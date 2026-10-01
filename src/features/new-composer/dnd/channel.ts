import { createDnd, type DndChannel } from '@oomfware/tug';

import type { PostMedia } from '../model/schema';

/** in-page drag payload; external files use native drop handlers. */
export type ThreadDragData =
	| { kind: 'post'; postId: string; index: number }
	| { kind: 'media'; postId: string; mediaId: string; mediaKind: PostMedia['kind']; index: number };

/** drop target data; the editor is the channel's only drop target. */
export type ThreadDropData = { kind: 'thread' };

/** the thread editor's drag channel. */
export type ThreadDnd = DndChannel<ThreadDragData, ThreadDropData>;

/**
 * creates the editor's drag channel.
 *
 * @returns a channel isolated to this editor's own draggables
 */
export const createThreadDnd = (): ThreadDnd => createDnd<ThreadDragData, ThreadDropData>();
