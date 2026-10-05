import type { ResourceUri } from '@atcute/lexicons';

import type { Plot } from 'wordgard/doc';
import { GardState } from 'wordgard/state';

import { getPosts } from '../model/schema';

/** AT-URI of the post the thread quotes, or null. */
export const threadQuote = GardState.Facet.define<ResourceUri, ResourceUri | null>({
	combine: (values) => values[0] ?? null,
});

/**
 * reads the thread's quote for the first post only.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns the quoted post's AT-URI, or null if there's no quote or this isn't the first post
 */
export const getPostQuoteUri = (state: GardState, node: Plot): ResourceUri | null => {
	const uri = state.facet(threadQuote);
	return uri !== null && getPosts(state.doc)[0]?.node === node ? uri : null;
};
