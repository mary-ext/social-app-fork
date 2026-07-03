/**
 * generate an ES256 signing key for the OAuth client-assertion backend.
 *
 * prints the PKCS8 PEM private key to set as the worker secret, and the public JWKS for reference.
 *
 * usage:
 *
 * ```sh
 * node scripts/generate-oauth-key.ts
 * wrangler secret put OAUTH_PRIVATE_KEY  # paste the PEM output, including the BEGIN/END lines
 * ```
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
