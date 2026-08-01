import { env } from 'cloudflare:workers';

import { ClientAssertionBackend, importClientAssertionPkcs8, isValidAud, Keyset } from '@atcute/oauth-cab';
import { InvalidRequestError } from '@atcute/xrpc-server';

import baseMetadata from '../public/oauth-client-metadata.json';

/** client-assertion procedure NSID and DPoP endpoint path. */
const CLIENT_ASSERTION_NSID = 'internal.app.getClientAssertion';

/** signing key id advertised in metadata and JWT headers. */
const SIGNING_KEY_ID = 'cab-1';

const clientId = baseMetadata.client_id;

const keyset = new Keyset([
	await importClientAssertionPkcs8(env.OAUTH_PRIVATE_KEY, { alg: 'ES256', kid: SIGNING_KEY_ID }),
]);

const backend = new ClientAssertionBackend({
	clientId,
	endpoint: `${new URL(clientId).origin}/xrpc/${CLIENT_ASSERTION_NSID}`,
	keyset,
});

/** serves client metadata with the worker's public signing keys. */
export const serveClientMetadata = (): Response => {
	return Response.json(
		{ ...baseMetadata, jwks: keyset.publicJwks },
		{ headers: { 'cache-control': 'public, max-age=300, must-revalidate' } },
	);
};

/**
 * verifies a DPoP proof and issues a client assertion for the authorization server.
 *
 * @param input.aud authorization server issuer
 * @param input.dpopProof inbound `DPoP` header value
 * @returns the client assertion as JSON
 * @throws {InvalidRequestError} if the issuer or proof is invalid
 */
export const issueClientAssertion = async ({
	aud,
	dpopProof,
}: {
	aud: string;
	dpopProof: string | null;
}): Promise<Response> => {
	if (!isValidAud(aud)) {
		throw new InvalidRequestError({ message: 'aud is not a valid issuer identifier' });
	}

	const result = await backend.verify({ dpopProof });
	if (!result.ok) {
		// no nonce provider is configured, so 'nonce_required' can't occur here.
		throw new InvalidRequestError({ error: 'InvalidDpopProof', message: `DPoP proof ${result.reason}` });
	}

	const assertion = await backend.issue(result.verified, { aud });
	return Response.json(
		{ client_assertion: assertion.clientAssertion },
		{ headers: { 'cache-control': 'no-store' } },
	);
};
