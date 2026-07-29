import { env } from 'cloudflare:workers';

import { ForbiddenError, InvalidRequestError, json, XRPCRouter } from '@atcute/xrpc-server';

import {
	extractLinkMeta,
	generateAltText,
	getClientAssertion,
	getLinkImage,
} from '../src/lib/lexicons/internal-app';
import { generateAltTextDraft } from './alt-text';
import { issueClientAssertion, serveClientMetadata } from './client-assertion';
import { resolveLinkMeta } from './resolve';
import { authorizeServiceCall, serveDidDocument } from './service-auth';

/** path of the OAuth client metadata document. */
const CLIENT_METADATA_PATH = '/oauth-client-metadata.json';

/** path of our DID document. */
const DID_DOCUMENT_PATH = '/.well-known/did.json';

/** seconds a resolved-metadata response is reused */
const EXTRACT_CACHE_TTL = 60 * 60;

/**
 * rejects anything that isn't a same-origin browser request.
 *
 * @param request the inbound request.
 * @throws {ForbiddenError} if the request didn't come from our own page.
 */
const requireSameOrigin = (request: Request): void => {
	if (request.headers.get('sec-fetch-site') !== 'same-origin') {
		throw new ForbiddenError({ message: 'cross-origin request rejected' });
	}
};

const router = new XRPCRouter({
	onError({ error, request }) {
		console.error(`xrpc handler error at ${request.url}:`, error);
	},
});

router.addProcedure(generateAltText, {
	async handler({ input, request }) {
		await authorizeServiceCall(request, { limiter: env.ALT_TEXT_LIMITER, lxm: generateAltText.nsid });

		return json(await generateAltTextDraft(input));
	},
});

router.addProcedure(getClientAssertion, {
	handler({ input, request }) {
		requireSameOrigin(request);
		return issueClientAssertion({ aud: input.aud, dpopProof: request.headers.get('dpop') });
	},
});

router.addQuery(extractLinkMeta, {
	async handler({ params, request, signal }) {
		requireSameOrigin(request);

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
		requireSameOrigin(request);

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
		const { pathname } = new URL(request.url);
		switch (pathname) {
			case CLIENT_METADATA_PATH: {
				return serveClientMetadata();
			}
			case DID_DOCUMENT_PATH: {
				return serveDidDocument();
			}
		}

		return router.fetch(request);
	},
};
