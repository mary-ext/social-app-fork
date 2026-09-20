import { reorder } from '@oomfware/tug/reorder';

import type { ChangeSet } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import { Paragraph } from 'wordgard/types';

import { ISOLATE_HISTORY } from '../editor/history';
import {
	findPostById,
	getPostParam,
	getPosts,
	newPost,
	type PostMedia,
	setPostMediaChange,
	type ThreadPost,
} from '../editor/schema';
import { createMedia } from './attachments';

/**
 * classifies and validates files, then appends the accepted ones to a post.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param files the picked or dropped files
 */
export const attachFiles = async (wg: Wordgard, postId: string, files: Iterable<File>): Promise<void> => {
	const { media } = await createMedia(files);
	addMediaTo(wg, postId, media);
};

/**
 * appends media to a post.
 *
 * @param wg the editor
 * @param post the post, already located in the document
 * @param media the media to add
 */
export const addMedia = (
	wg: Wordgard,
	post: Pick<ThreadPost, 'node' | 'pos'>,
	media: readonly PostMedia[],
): void => {
	if (media.length === 0) {
		return;
	}

	wg.dispatch({
		changes: setPostMediaChange(post.pos, post.node, [...getPostParam(post.node).media, ...media]),
		userEvent: 'media.add',
		annotations: ISOLATE_HISTORY,
	});
};

/**
 * appends media to the post with the given id.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param media the media to add
 */
export const addMediaTo = (wg: Wordgard, postId: string, media: readonly PostMedia[]): void => {
	const post = findPostById(wg.state.doc, postId);
	if (post) {
		addMedia(wg, post, media);
	}
};

/**
 * inserts media at a given slot in a post.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param at the slot the media lands in
 * @param media the media to add
 */
export const insertMediaAt = (
	wg: Wordgard,
	postId: string,
	at: number,
	media: readonly PostMedia[],
): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post || media.length === 0) {
		return;
	}

	const existing = getPostParam(post.node).media;
	wg.dispatch({
		changes: setPostMediaChange(
			post.pos,
			post.node,
			existing.toSpliced(Math.min(at, existing.length), 0, ...media),
		),
		userEvent: 'media.add',
		annotations: ISOLATE_HISTORY,
	});
};

/**
 * removes a media entry from a post.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param mediaId the media entry's id
 */
export const removeMedia = (wg: Wordgard, postId: string, mediaId: string): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post) {
		return;
	}

	wg.dispatch({
		changes: setPostMediaChange(
			post.pos,
			post.node,
			getPostParam(post.node).media.filter((item) => item.id !== mediaId),
		),
		userEvent: 'media.remove',
		annotations: ISOLATE_HISTORY,
	});
};

// #region moving

type LiftedMedia = { item: PostMedia; source: ThreadPost; changes: ChangeSet.Spec[] };

const liftMedia = (wg: Wordgard, postId: string, mediaId: string): LiftedMedia | null => {
	const source = findPostById(wg.state.doc, postId);
	const item = source && getPostParam(source.node).media.find((entry) => entry.id === mediaId);
	if (!source || !item) {
		return null;
	}

	const remaining = getPostParam(source.node).media.filter((entry) => entry.id !== mediaId);
	return { item, source, changes: [setPostMediaChange(source.pos, source.node, remaining)] };
};

const dispatchMove = (wg: Wordgard, changes: ChangeSet.Spec[]): void => {
	wg.dispatch({ changes, userEvent: 'media.move', annotations: ISOLATE_HISTORY });
};

/**
 * moves an attachment within or between posts.
 *
 * @param wg the editor
 * @param fromId the id of the post holding the entry
 * @param mediaId the media entry's id
 * @param toId the id of the post it moves to
 * @param toIndex destination index after removal from the source; defaults to appending
 */
export const moveMediaToSlot = (
	wg: Wordgard,
	fromId: string,
	mediaId: string,
	toId: string,
	toIndex?: number,
): void => {
	const lifted = liftMedia(wg, fromId, mediaId);
	const dest = findPostById(wg.state.doc, toId);
	if (!lifted || !dest) {
		return;
	}

	const media = getPostParam(dest.node).media;

	if (toId === fromId) {
		const from = media.findIndex((entry) => entry.id === mediaId);
		const to = Math.min(toIndex ?? media.length - 1, media.length - 1);
		if (to === from) {
			return;
		}

		dispatchMove(wg, [setPostMediaChange(dest.pos, dest.node, reorder(media, from, to))]);
		return;
	}

	const at = Math.min(toIndex ?? media.length, media.length);
	dispatchMove(wg, [
		...lifted.changes,
		setPostMediaChange(dest.pos, dest.node, media.toSpliced(at, 0, lifted.item)),
	]);
};

/**
 * moves a media entry to the end of another post's media.
 *
 * @param wg the editor
 * @param fromId the id of the post holding the entry
 * @param mediaId the media entry's id
 * @param toId the id of the post it moves to
 */
export const moveMediaTo = (wg: Wordgard, fromId: string, mediaId: string, toId: string): void => {
	if (toId !== fromId) {
		moveMediaToSlot(wg, fromId, mediaId, toId);
	}
};

/**
 * swaps a media entry with its neighbour inside the same post.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param mediaId the media entry's id
 * @param dir -1 to move it earlier, 1 to move it later
 */
export const nudgeMedia = (wg: Wordgard, postId: string, mediaId: string, dir: -1 | 1): void => {
	const post = findPostById(wg.state.doc, postId);
	const media = post && getPostParam(post.node).media;
	const at = media ? media.findIndex((entry) => entry.id === mediaId) : -1;
	if (!media || at === -1 || at + dir < 0 || at + dir >= media.length) {
		return;
	}

	moveMediaToSlot(wg, postId, mediaId, postId, at + dir);
};

/**
 * moves a media entry to the preceding post.
 *
 * @param wg the editor
 * @param fromId the id of the post holding the entry
 * @param mediaId the media entry's id
 */
export const moveMediaUp = (wg: Wordgard, fromId: string, mediaId: string): void => {
	const posts = getPosts(wg.state.doc);
	const from = posts.find((post) => post.id === fromId);
	const previous = from && posts[from.index - 1];
	if (previous) {
		moveMediaTo(wg, fromId, mediaId, previous.id);
	}
};

/**
 * moves an attachment to the following post, creating one if needed.
 *
 * @param wg the editor
 * @param fromId the id of the post holding the entry
 * @param mediaId the media entry's id
 */
export const moveMediaDown = (wg: Wordgard, fromId: string, mediaId: string): void => {
	const posts = getPosts(wg.state.doc);
	const from = posts.find((post) => post.id === fromId);
	if (!from) {
		return;
	}

	const next = posts[from.index + 1];
	if (next) {
		moveMediaTo(wg, fromId, mediaId, next.id);
		return;
	}

	const lifted = liftMedia(wg, fromId, mediaId);
	if (!lifted) {
		return;
	}

	dispatchMove(wg, [
		...lifted.changes,
		{
			from: lifted.source.pos + lifted.source.node.length,
			insert: [newPost([lifted.item]).create([Paragraph.create()])],
		},
	]);
};

// #endregion
