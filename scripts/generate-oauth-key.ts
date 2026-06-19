/**
 * generates an ES256 signing key for the OAuth client-assertion backend (the confidential production client).
 *
 * prints the PKCS8 PEM private key to set as the worker secret, and the public jwks for reference (the worker
 * derives and advertises the jwks itself, so the printed copy is informational only).
 *
 * usage:
 *
 * ```sh
 * node scripts/generate-oauth-key.ts
 * wrangler secret put OAUTH_PRIVATE_KEY  # paste the PEM output, including the BEGIN/END lines
 * ```
 *
 * the `kid` below must match the worker's SIGNING_KEY_ID (worker/client-assertion.ts).
 */
import { exportPkcs8PrivateKey, generateClientAssertionKey, Keyset } from '@atcute/oauth-cab';

const SIGNING_KEY_ID = 'cab-1';

const key = await generateClientAssertionKey(SIGNING_KEY_ID);
const pem = await exportPkcs8PrivateKey(key);
const keyset = new Keyset([key]);

console.log('# OAUTH_PRIVATE_KEY (PKCS8 PEM) — set as a wrangler secret:\n');
console.log(pem.trim());
console.log('\n# public jwks (the worker advertises this at /oauth-client-metadata.json):\n');
console.log(JSON.stringify(keyset.publicJwks, null, 2));
