import type { Plot } from 'wordgard/doc';
import type { GardState } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import { getEmbedSession } from '../embeds/embed-session';
import { type EmbedSession, type PostEmbeds, selectPostEmbeds } from '../embeds/link-embeds';
import { getPostParam } from './schema';
import { measureCached } from './text-measurement';

/** a post's measured text and embeds. */
export type PostInfo = {
	/** grapheme count after link shortening, excluding a trailing link shown as an embed. */
	length: number;
	/** UTF-16 text offset where the post exceeds the limit, or null. */
	overflowAt: number | null;
	embeds: PostEmbeds;
};

// reuse results across subscriber reads; posts retain node identity until edited.
const cache = new WeakMap<Plot, { session: EmbedSession; info: PostInfo }>();

const computePostInfo = (node: Plot, session: EmbedSession): PostInfo => {
	const { measurement } = measureCached(node);
	const { embeds, stripped } = selectPostEmbeds(measurement, getPostParam(node).media, session);

	if (stripped) {
		const { overflowAt } = measurement;
		return {
			length: stripped.length,
			overflowAt: overflowAt !== null && overflowAt < stripped.textEnd ? overflowAt : null,
			embeds,
		};
	}

	return { length: measurement.length, overflowAt: measurement.overflowAt, embeds };
};

/**
 * reads a post's measured text and embeds.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns the same info object for repeated reads of the same post and embed session
 */
export const getPostInfo = (state: GardState, node: Plot): PostInfo => {
	const session = getEmbedSession(state);

	const hit = cache.get(node);
	if (hit?.session === session) {
		return hit.info;
	}

	const info = computePostInfo(node, session);
	cache.set(node, { session, info });
	return info;
};

/**
 * checks whether a post exceeds the character limit.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post is over the limit
 */
export const isOverLimit = (state: GardState, node: Plot): boolean => {
	return getPostInfo(state, node).length > MAX_POST_GRAPHEME_LENGTH;
};

/**
 * checks whether a post has media or link embeds.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post has attachments
 */
export const hasAttachments = (state: GardState, node: Plot): boolean => {
	const { embeds } = getPostInfo(state, node);
	return getPostParam(node).media.length > 0 || embeds.external !== null || embeds.record !== null;
};

/**
 * checks whether a post has no text, media, or embeds.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post is blank
 */
export const isBlankPost = (state: GardState, node: Plot): boolean => {
	return getPostInfo(state, node).length === 0 && !hasAttachments(state, node);
};
