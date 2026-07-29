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
 * verifies the service auth token attached to this request
 *
 * @param request the proxied request.
 * @param options.limiter the rate limiter the call is charged against.
 * @param options.lxm the method the token must have been issued for.
 * @throws {AuthRequiredError} if the token is missing, malformed, expired, or issued for another audience or
 *   method.
 * @throws {RateLimitExceededError} if the caller is over its budget for the method.
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
