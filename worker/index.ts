import { InvalidRequestError, XRPCRouter } from '@atcute/xrpc-server';

import { extractLinkMeta, getLinkImage } from '../src/lib/lexicons/internal-app';
import { resolveLinkMeta } from './resolve';

/**
 * seconds a resolved-metadata response is reused; kept below the thumbnail ttl so a cache hit still has its
 * image.
 */
const EXTRACT_CACHE_TTL = 60 * 60;

const router = new XRPCRouter({
	onError({ error, request }) {
		console.error(`xrpc handler error at ${request.url}:`, error);
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

export default router;
