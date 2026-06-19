import { type FetchMiddleware, ForbiddenError, InvalidRequestError, XRPCRouter } from '@atcute/xrpc-server';

import { extractLinkMeta, getClientAssertion, getLinkImage } from '../src/lib/lexicons/internal-app';
import { issueClientAssertion, serveClientMetadata } from './client-assertion';
import { resolveLinkMeta } from './resolve';

/** path of the OAuth client metadata document, served outside the xrpc router and ahead of the COP guard. */
const CLIENT_METADATA_PATH = '/oauth-client-metadata.json';

/**
 * seconds a resolved-metadata response is reused; kept below the thumbnail ttl so a cache hit still has its
 * image.
 */
const EXTRACT_CACHE_TTL = 60 * 60;

/**
 * Rejects anything that isn't a same-origin browser request. `Sec-Fetch-Site` is a forbidden header — page
 * scripts can't forge it — so this blocks other origins (and non-browser callers, which omit it) from driving
 * the client-assertion endpoint or abusing the link unfurler. The client metadata document is served before
 * this runs, since the authorization server fetches it server-side without the header.
 */
const requireSameOrigin: FetchMiddleware = (request, next) => {
	if (request.headers.get('sec-fetch-site') !== 'same-origin') {
		return Promise.resolve(new ForbiddenError({ message: 'cross-origin request rejected' }).toResponse());
	}
	return next(request);
};

const router = new XRPCRouter({
	middlewares: [requireSameOrigin],
	onError({ error, request }) {
		console.error(`xrpc handler error at ${request.url}:`, error);
	},
});

router.addProcedure(getClientAssertion, {
	handler({ input, request }) {
		return issueClientAssertion({ aud: input.aud, dpopProof: request.headers.get('dpop') });
	},
});

router.addQuery(extractLinkMeta, {
	async handler({ params, request, signal }) {
		// repeated resolutions of the same url are served from cache, bounding outbound fetches and billed
		// invocations under abuse. only successful results reach the cache (errors throw before the put).
		const cached = await caches.default.match(request);
		if (cached) {
			return cached;
		}

		const data = await resolveLinkMeta({ requestUrl: request.url, signal, url: params.url });
		const response = Response.json(data, {
			headers: { 'cache-control': `public, max-age=${EXTRACT_CACHE_TTL}` },
		});
		await caches.default.put(request, response.clone());
		return response;
	},
});

router.addQuery(getLinkImage, {
	async handler({ request }) {
		// the cache was populated by extractLinkMeta under this exact url; this endpoint never fetches.
		const cached = await caches.default.match(request);
		if (!cached) {
			throw new InvalidRequestError({
				error: 'NotFound',
				message: 'thumbnail not found or expired',
				status: 404,
			});
		}
		return cached;
	},
});

export default {
	async fetch(request: Request): Promise<Response> {
		// the metadata document is fetched by the authorization server (server-side, no `Sec-Fetch-Site`), so
		// it's served here, ahead of the router's same-origin guard. everything else goes through the router.
		const { pathname } = new URL(request.url);
		if (pathname === CLIENT_METADATA_PATH) {
			return serveClientMetadata();
		}
		return router.fetch(request);
	},
};
