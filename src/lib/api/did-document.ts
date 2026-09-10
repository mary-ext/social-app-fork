import { getAtprotoHandle } from '@atcute/identity';
import {
	AtprotoWebDidDocumentResolver,
	CompositeDidDocumentResolver,
	PlcDidDocumentResolver,
} from '@atcute/identity-resolver';
import type { Did, Handle } from '@atcute/lexicons';

const didDocumentResolver = new CompositeDidDocumentResolver({
	methods: {
		plc: new PlcDidDocumentResolver(),
		web: new AtprotoWebDidDocumentResolver(),
	},
});

const isResolvableDid = (did: Did): did is Did<'plc' | 'web'> => {
	return did.startsWith('did:plc:') || did.startsWith('did:web:');
};

/**
 * returns the unverified, display-only handle claimed by a DID document within three seconds.
 *
 * @param did DID to resolve.
 * @param signal abort signal.
 * @returns claimed handle, or undefined if unavailable.
 */
export const getClaimedHandle = async (did: Did, signal: AbortSignal): Promise<Handle | undefined> => {
	if (!isResolvableDid(did)) {
		return undefined;
	}

	try {
		const doc = await didDocumentResolver.resolve(did, {
			signal: AbortSignal.any([signal, AbortSignal.timeout(3_000)]),
		});
		return getAtprotoHandle(doc) ?? undefined;
	} catch {
		// DID resolution is best-effort.
		return undefined;
	}
};
