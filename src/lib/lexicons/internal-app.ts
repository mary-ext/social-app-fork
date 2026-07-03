import * as ComAtprotoRepoStrongRef from '@atcute/atproto/types/repo/strongRef';
import * as AppBskyEmbedExternal from '@atcute/bluesky/types/app/embed/external';
import type {} from '@atcute/lexicons/ambient';
import * as v from '@atcute/lexicons/validations';

/**
 * resolves opengraph/twitter metadata for an external URL. when present, the returned `image` is an
 * origin-relative path to {@link getLinkImage}. for a standard.site link advertising Atmosphere records,
 * hydrates and returns the `associatedRefs` and enhanced `view`.
 */
export const extractLinkMeta = v.query('internal.app.extractLinkMeta', {
	params: v.object({
		url: v.string(),
	}),
	output: {
		type: 'lex',
		schema: v.object({
			associatedRefs: v.optional(v.array(ComAtprotoRepoStrongRef.mainSchema)),
			description: v.optional(v.string()),
			image: v.optional(v.string()),
			title: v.optional(v.string()),
			url: v.optional(v.string()),
			view: v.optional(AppBskyEmbedExternal.viewSchema),
		}),
	},
});

/**
 * mints a short-lived, DPoP-bound client assertion (RFC 7523) for our confidential OAuth client, signed with
 * the client's private key.
 */
export const getClientAssertion = v.procedure('internal.app.getClientAssertion', {
	params: null,
	input: {
		type: 'lex',
		schema: v.object({
			aud: v.string(),
		}),
	},
	output: {
		type: 'lex',
		schema: v.object({
			client_assertion: v.string(),
		}),
	},
});

/**
 * Serves a link thumbnail previously fetched and cached by {@link extractLinkMeta}. The `k` parameter
 * identifies a cache entry; this endpoint never fetches from the network.
 */
export const getLinkImage = v.query('internal.app.getLinkImage', {
	params: v.object({
		k: v.string(),
	}),
	output: {
		type: 'blob',
		encoding: ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'],
	},
});

declare module '@atcute/lexicons/ambient' {
	interface XRPCProcedures {
		'internal.app.getClientAssertion': typeof getClientAssertion;
	}

	interface XRPCQueries {
		'internal.app.extractLinkMeta': typeof extractLinkMeta;
		'internal.app.getLinkImage': typeof getLinkImage;
	}
}
