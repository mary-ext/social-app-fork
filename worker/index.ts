import { env } from 'cloudflare:workers';

import { ForbiddenError, InvalidRequestError, json, XRPCRouter } from '@atcute/xrpc-server';

import {
	extractLinkMeta,
	generateAltText,
	getClientAssertion,
	getLinkImage,
	translateText,
} from '../src/lib/lexicons';
import { generateAltTextDraft } from './alt-text';
import { issueClientAssertion, serveClientMetadata } from './client-assertion';
import { resolveLinkMeta } from './resolve';
import { authorizeServiceCall, serveDidDocument } from './service-auth';
import { translatePostText } from './translate';

const CLIENT_METADATA_PATH = '/oauth-client-metadata.json';

const DID_DOCUMENT_PATH = '/.well-known/did.json';

const EXTRACT_CACHE_TTL = 60 * 60;

/** accepts requests from the app origin only. */
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
		await authorizeServiceCall(request, { limiter: env.AI_LIMITER, lxm: generateAltText.nsid });

		return json(await generateAltTextDraft(input));
	},
});

router.addProcedure(getClientAssertion, {
	handler({ input, request }) {
		requireSameOrigin(request);
		return issueClientAssertion({ aud: input.aud, dpopProof: request.headers.get('dpop') });
	},
});

router.addProcedure(translateText, {
	async handler({ input, request }) {
		await authorizeServiceCall(request, { limiter: env.AI_LIMITER, lxm: translateText.nsid });

		return json(await translatePostText(input));
	},
});

router.addQuery(extractLinkMeta, {
	async handler({ params, request, signal }) {
		requireSameOrigin(request);

		// cache successful resolutions to bound repeated work.
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

		// thumbnails are written by extractLinkMeta; this endpoint never fetches.
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
