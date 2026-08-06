import { type Client, ok } from '@atcute/client';
import type { Did, Handle } from '@atcute/lexicons';

/**
 * creates an appview-backed handle resolver.
 *
 * @param appview the appview client
 * @returns a resolver that returns undefined on failure
 */
export const createHandleResolver = (appview: Client) => {
	return async (handle: Handle): Promise<Did | undefined> => {
		try {
			const res = await ok(appview.get('com.atproto.identity.resolveHandle', { params: { handle } }));
			return res.did;
		} catch {
			return undefined;
		}
	};
};
