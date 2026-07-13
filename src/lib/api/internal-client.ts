import { Client, simpleFetchHandler } from '@atcute/client';

// registers the `internal.app.*` queries on the ambient XRPC interface so `.get()` is typed.
// oxlint-disable-next-line import/no-empty-named-blocks, unicorn/require-module-specifiers -- the empty specifier list is the point
import type {} from '#/lib/lexicons/internal-app';

/**
 * XRPC client for fork-internal endpoints (the `internal.app.*` namespace) served same-origin by our
 * Cloudflare Worker. Unlike the appview/pds clients, this is static and session-independent.
 */
export const internalClient = new Client({
	handler: simpleFetchHandler({ service: window.location.origin }),
});
