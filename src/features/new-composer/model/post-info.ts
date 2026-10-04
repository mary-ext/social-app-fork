import type { ResourceUri } from '@atcute/lexicons';

import type { Plot } from 'wordgard/doc';
import type { GardState } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { trimText } from '#/lib/utils/text';

import { getEmbedSession } from '../embeds/embed-session';
import { type EmbedSession, type PostEmbeds, selectPostEmbeds } from '../embeds/link-embeds';
import { getPostQuoteUri } from '../embeds/thread-quote';
import { getPostParam } from './schema';
import { measureCached, type TrailingLink } from './text-measurement';

/** a post's measured text and embeds. */
export type PostInfo = {
	/** grapheme count after link shortening, excluding a trailing link shown as an embed. */
	length: number;
	/** UTF-16 text offset where the post exceeds the limit, or null. */
	overflowAt: number | null;
	embeds: PostEmbeds;
	/** trailing link to remove if its embed is published, or null. */
	stripped: TrailingLink | null;
};

// reordering can move the quote without changing node identity, so check the quote URI too.
const cache = new WeakMap<Plot, { session: EmbedSession; quoteUri: ResourceUri | null; info: PostInfo }>();

const computePostInfo = (node: Plot, session: EmbedSession, quote: ResourceUri | null): PostInfo => {
	const { measurement } = measureCached(node);
	const { embeds, stripped } = selectPostEmbeds(
		measurement,
		{ media: getPostParam(node).media, quote },
		session,
	);

	if (stripped) {
		const { overflowAt } = measurement;
		return {
			length: stripped.length,
			overflowAt: overflowAt !== null && overflowAt < stripped.textEnd ? overflowAt : null,
			embeds,
			stripped,
		};
	}

	return { length: measurement.length, overflowAt: measurement.overflowAt, embeds, stripped: null };
};

/**
 * reads a post's measured text and embeds.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns the same info object while the post node, embed session, and quote URI are unchanged
 */
export const getPostInfo = (state: GardState, node: Plot): PostInfo => {
	const session = getEmbedSession(state);
	const quoteUri = getPostQuoteUri(state, node);

	const hit = cache.get(node);
	if (hit?.session === session && hit.quoteUri === quoteUri) {
		return hit.info;
	}

	const info = computePostInfo(node, session, quoteUri);
	cache.set(node, { session, quoteUri, info });
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
 * checks whether a post has media or embeds.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post has attachments
 */
export const hasAttachments = (state: GardState, node: Plot): boolean => {
	const { embeds } = getPostInfo(state, node);
	return (
		getPostParam(node).media.length > 0 ||
		embeds.external !== null ||
		embeds.quote !== null ||
		embeds.record !== null
	);
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

/**
 * checks whether publishing skips a post. unlike {@link isBlankPost}, ignores whitespace.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post has no attachments and only whitespace
 */
export const isSkippedPost = (state: GardState, node: Plot): boolean => {
	return trimText(measureCached(node).text) === '' && !hasAttachments(state, node);
};
