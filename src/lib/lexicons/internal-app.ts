import * as ComAtprotoRepoStrongRef from '@atcute/atproto/types/repo/strongRef';
import * as AppBskyEmbedExternal from '@atcute/bluesky/types/app/embed/external';
import type {} from '@atcute/lexicons/ambient';
import * as v from '@atcute/lexicons/validations';

/**
 * Resolves opengraph/twitter metadata for an external url. When present, the returned `image` is an
 * origin-relative path to {@link getLinkImage} rather than the upstream image url. For a standard.site link —
 * one advertising Atmosphere records via `<link rel>` tags — the worker asks the appview to hydrate them, and
 * returns the resulting `associatedRefs` (uri+cid) and enhanced `view`.
 *
 * This is a fork-internal lexicon served by our own Cloudflare Worker, not a federated atproto method; the
 * `internal.app` authority is intentionally non-resolvable so it can never collide with a real nsid.
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
	interface XRPCQueries {
		'internal.app.extractLinkMeta': typeof extractLinkMeta;
		'internal.app.getLinkImage': typeof getLinkImage;
	}
}
