import { env } from 'cloudflare:workers';

import { ClientAssertionBackend, importClientAssertionPkcs8, isValidAud, Keyset } from '@atcute/oauth-cab';
import { InvalidRequestError } from '@atcute/xrpc-server';

import baseMetadata from '../public/oauth-client-metadata.json';

/** nsid of the client-assertion procedure; its `/xrpc/<nsid>` URL is the DPoP `htu` the backend verifies. */
const CLIENT_ASSERTION_NSID = 'internal.app.getClientAssertion';

/** key id tagging the signing key; advertised in the metadata jwks and in each assertion's JWT header. */
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

/**
 * Serves the OAuth client metadata document, injecting the public jwks derived from the signing key so the
 * advertised keys can never drift from the secret the worker signs with.
 *
 * @returns the client metadata as a JSON response.
 */
export const serveClientMetadata = (): Response => {
	return Response.json(
		{ ...baseMetadata, jwks: keyset.publicJwks },
		{ headers: { 'cache-control': 'public, max-age=300, must-revalidate' } },
	);
};

/**
 * Verifies an inbound DPoP proof and mints a DPoP-bound client assertion for the given authorization server.
 *
 * @param input.aud the authorization server issuer the assertion is minted for.
 * @param input.dpopProof the inbound `DPoP` header value.
 * @returns the client assertion JWT as a JSON response. The fixed RFC 7523 assertion type is not sent — the
 *   client hardcodes it.
 * @throws {InvalidRequestError} if `aud` is malformed or the DPoP proof is missing, invalid, or expired.
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
