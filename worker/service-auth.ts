import { env } from 'cloudflare:workers';

import {
	AtprotoWebDidDocumentResolver,
	CompositeDidDocumentResolver,
	PlcDidDocumentResolver,
} from '@atcute/identity-resolver';
import type { Did, Nsid } from '@atcute/lexicons';
import { RateLimitExceededError } from '@atcute/xrpc-server';
import { ServiceJwtVerifier } from '@atcute/xrpc-server/auth';

import baseMetadata from '../public/oauth-client-metadata.json';

const CLIENT_ID = new URL(baseMetadata.client_id);

const IS_DEV = env.DEV === 'true';

const SERVICE_ID = 'internal_app';
const SERVICE_DID: Did<'web'> = `did:web:${encodeURIComponent(CLIENT_ID.host)}`;

const verifier = new ServiceJwtVerifier({
	acceptAudiences: [SERVICE_DID, `${SERVICE_DID}#${SERVICE_ID}`],
	resolver: new CompositeDidDocumentResolver({
		methods: {
			plc: new PlcDidDocumentResolver(),
			web: new AtprotoWebDidDocumentResolver(),
		},
	}),
});

export const serveDidDocument = (): Response => {
	return Response.json(
		{
			'@context': ['https://www.w3.org/ns/did/v1'],
			id: SERVICE_DID,
			service: [
				{
					id: `#${SERVICE_ID}`,
					type: 'InternalAppService',
					serviceEndpoint: CLIENT_ID.origin,
				},
			],
		},
		{
			headers: {
				'cache-control': 'public, max-age=300, must-revalidate',
				'content-type': 'application/did+ld+json; charset=utf-8',
			},
		},
	);
};

/**
 * verifies the service-auth token and charges the caller's rate limit.
 *
 * @param request proxied request
 * @param options.limiter rate limiter for the call
 * @param options.lxm method the token must target
 * @throws {AuthRequiredError} when the token is invalid
 * @throws {RateLimitExceededError} when the caller exceeds its budget
 */
export const authorizeServiceCall = async (
	request: Request,
	{ limiter, lxm }: { limiter: RateLimit; lxm: Nsid },
): Promise<void> => {
	if (IS_DEV) {
		return;
	}

	const { issuer } = await verifier.verifyRequest(request, { lxm });

	const { success } = await limiter.limit({ key: issuer });
	if (!success) {
		throw new RateLimitExceededError({ message: 'too many requests, try again in a moment' });
	}
};
