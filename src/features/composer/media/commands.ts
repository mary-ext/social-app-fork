import { reorder } from '@oomfware/tug/reorder';

import type { ChangeSet } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import type { Transaction } from 'wordgard/state';

import type { Gif } from '#/lib/media/external-gif/types';

import { appendPost } from '../commands/append-post';
import { revealPostEnd } from '../editor/scrolling';
import { ISOLATE_HISTORY } from '../model/history';
import {
	endOfLastLine,
	findPostById,
	getPostParam,
	getPosts,
	type PostMedia,
	setPostMediaChange,
} from '../model/schema';
import { findActivePost } from '../model/selection';
import { createGifMedia, createMedia } from './attachments';
import { revealMedia } from './reveal-media';

/** an attachment's id and containing post. */
export type MediaRef = {
	postId: string;
	mediaId: string;
};

// file reads started before publishing may finish after the editor locks.
const dispatchMediaChange = (wg: Wordgard, spec: Transaction.Spec): void => {
	if (!wg.state.readOnly) {
		wg.dispatch(spec);
	}
};

// caret scrolling doesn't reveal attachments below the text.
const addAndRevealMedia = (wg: Wordgard, postId: string, media: readonly PostMedia[]): void => {
	addMediaTo(wg, postId, media);
	if (media[0]) {
		// reveal the tile first, then correct its vertical scroll to include the post's toolbar.
		revealMedia(media[0].id);
		revealPostEnd(wg, postId);
	}
};

/**
 * validates files, appends accepted media to a post, and scrolls it into view.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param files the picked or pasted files
 */
export const attachFiles = async (wg: Wordgard, postId: string, files: Iterable<File>): Promise<void> => {
	const { media } = await createMedia(files);
	addAndRevealMedia(wg, postId, media);
};

/**
 * appends an external GIF to a post and scrolls it into view.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param gif a GIF picker result
 */
export const attachGif = (wg: Wordgard, postId: string, gif: Gif): void => {
	addAndRevealMedia(wg, postId, [createGifMedia(gif)]);
};

/**
 * appends media to a post.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param media the media to add
 */
export const addMediaTo = (wg: Wordgard, postId: string, media: readonly PostMedia[]): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post || media.length === 0) {
		return;
	}

	dispatchMediaChange(wg, {
		changes: setPostMediaChange(post.pos, post.node, [...getPostParam(post.node).media, ...media]),
		userEvent: 'media.add',
		annotations: ISOLATE_HISTORY,
	});
};

/**
 * inserts media at a post's slot, then stably groups it by kind.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param at the index to insert before
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
	dispatchMediaChange(wg, {
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
 * removes an attachment from its post.
 *
 * @param wg the editor
 * @param ref the attachment
 */
export const removeMedia = (wg: Wordgard, { postId, mediaId }: MediaRef): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post) {
		return;
	}

	dispatchMediaChange(wg, {
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

type LiftedMedia = { item: PostMedia; changes: ChangeSet.Spec[] };

const liftMedia = (wg: Wordgard, { postId, mediaId }: MediaRef): LiftedMedia | null => {
	const source = findPostById(wg.state.doc, postId);
	const item = source && getPostParam(source.node).media.find((entry) => entry.id === mediaId);
	if (!source || !item) {
		return null;
	}

	const remaining = getPostParam(source.node).media.filter((entry) => entry.id !== mediaId);
	return { item, changes: [setPostMediaChange(source.pos, source.node, remaining)] };
};

const dispatchMove = (wg: Wordgard, changes: ChangeSet.Spec[], selection?: { anchor: number }): void => {
	dispatchMediaChange(wg, { changes, selection, userEvent: 'media.move', annotations: ISOLATE_HISTORY });
};

const moveMedia = (wg: Wordgard, ref: MediaRef, toId: string, toIndex: number | undefined): void => {
	const lifted = liftMedia(wg, ref);
	const dest = findPostById(wg.state.doc, toId);
	if (!lifted || !dest) {
		return;
	}

	const media = getPostParam(dest.node).media;

	if (toId === ref.postId) {
		const from = media.findIndex((entry) => entry.id === ref.mediaId);
		const to = Math.min(toIndex ?? media.length - 1, media.length - 1);
		if (to === from) {
			return;
		}

		dispatchMove(wg, [setPostMediaChange(dest.pos, dest.node, reorder(media, from, to))]);
		return;
	}

	const at = Math.min(toIndex ?? media.length, media.length);
	let selection: { anchor: number } | undefined;
	if (findActivePost(wg.state)?.before !== dest.pos) {
		// keep the destination post's controls tabbable.
		// media-only changes leave post positions unchanged.
		selection = { anchor: endOfLastLine(dest.pos + dest.node.length) };
	}
	dispatchMove(
		wg,
		[...lifted.changes, setPostMediaChange(dest.pos, dest.node, media.toSpliced(at, 0, lifted.item))],
		selection,
	);
};

/**
 * reorders or transfers an attachment. transfers move the caret to the destination unless already there.
 *
 * @param wg the editor
 * @param ref the attachment
 * @param slot the destination post and its media index after removal from the source
 */
export const moveMediaToSlot = (
	wg: Wordgard,
	ref: MediaRef,
	slot: { postId: string; index: number },
): void => {
	moveMedia(wg, ref, slot.postId, slot.index);
};

/**
 * moves an attachment to the end of another post's media, placing the caret in that post.
 *
 * @param wg the editor
 * @param ref the attachment
 * @param postId the id of the post it moves to
 */
export const moveMediaTo = (wg: Wordgard, ref: MediaRef, postId: string): void => {
	if (postId !== ref.postId) {
		moveMedia(wg, ref, postId, undefined);
	}
};

/**
 * swaps adjacent attachments of the same kind within a post.
 *
 * @param wg the editor
 * @param ref the attachment
 * @param dir -1 to move it earlier, 1 to move it later
 */
export const nudgeMedia = (wg: Wordgard, ref: MediaRef, dir: -1 | 1): void => {
	const post = findPostById(wg.state.doc, ref.postId);
	const media = post && getPostParam(post.node).media;
	const at = media ? media.findIndex((entry) => entry.id === ref.mediaId) : -1;
	// regrouping would undo a swap across kinds.
	if (!media || at === -1 || media[at + dir]?.kind !== media[at]!.kind) {
		return;
	}

	moveMedia(wg, ref, ref.postId, at + dir);
};

/**
 * moves an attachment to the preceding post, placing the caret in it.
 *
 * @param wg the editor
 * @param ref the attachment
 */
export const moveMediaUp = (wg: Wordgard, ref: MediaRef): void => {
	const { doc } = wg.state;
	const from = findPostById(doc, ref.postId);
	const previous = from && getPosts(doc)[from.index - 1];
	if (previous) {
		moveMediaTo(wg, ref, previous.id);
	}
};

/**
 * moves an attachment and the caret to the following post, creating one if needed.
 *
 * @param wg the editor
 * @param ref the attachment
 */
export const moveMediaDown = (wg: Wordgard, ref: MediaRef): void => {
	const { doc } = wg.state;
	const from = findPostById(doc, ref.postId);
	if (!from) {
		return;
	}

	const next = getPosts(doc)[from.index + 1];
	if (next) {
		moveMediaTo(wg, ref, next.id);
	} else {
		moveMediaToNewPost(wg, ref);
	}
};

/**
 * moves an attachment into a new post at the end of the thread, placing the caret in it.
 *
 * @param wg the editor
 * @param ref the attachment
 */
export const moveMediaToNewPost = (wg: Wordgard, ref: MediaRef): void => {
	const lifted = liftMedia(wg, ref);
	if (lifted && !wg.state.readOnly) {
		// media-only changes leave the append position unchanged.
		appendPost(wg, { userEvent: 'media.move', media: [lifted.item], changes: lifted.changes });
	}
};

/**
 * appends a new post holding the given media, placing the caret in it.
 *
 * @param wg the editor
 * @param media the media to add; nothing is appended when empty
 */
export const addMediaInNewPost = (wg: Wordgard, media: readonly PostMedia[]): void => {
	if (media.length > 0 && !wg.state.readOnly) {
		appendPost(wg, { userEvent: 'media.add', media });
	}
};

// #endregion
