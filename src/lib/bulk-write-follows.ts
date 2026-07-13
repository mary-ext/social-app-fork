import type { ComAtprotoRepoApplyWrites, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import * as TID from '@atcute/tid';

import chunk from 'lodash.chunk';

import { until } from '#/lib/async/until';

/**
 * Creates follow records in chunks and waits until at least one follow indexes.
 *
 * @param clients the appview and pds clients plus the repo did.
 * @param dids actor dids to follow.
 * @param via optional starter-pack reference attached to each follow.
 * @returns a map of followed dids to created follow uris.
 */
export async function bulkWriteFollows(
	{ appview, did, pds }: { appview: Client; did: Did; pds: Client },
	dids: string[],
	via?: ComAtprotoRepoStrongRef.Main,
) {
	const items = dids.map((d) => ({ did: d as Did, rkey: TID.now() }));

	const followWrites: ComAtprotoRepoApplyWrites.$input['writes'] = items.map((item) => ({
		$type: 'com.atproto.repo.applyWrites#create',
		collection: 'app.bsky.graph.follow',
		rkey: item.rkey,
		value: {
			$type: 'app.bsky.graph.follow',
			createdAt: new Date().toISOString(),
			subject: item.did,
			via,
		},
	}));

	const chunks = chunk(followWrites, 50);
	for (const batch of chunks) {
		await ok(pds.post('com.atproto.repo.applyWrites', { input: { repo: did, writes: batch } }));
	}
	await whenFollowsIndexed(appview, did, (res) => !!res.follows.length);

	const followUris = new Map<string, string>();
	for (const item of items) {
		followUris.set(item.did, `at://${did}/app.bsky.graph.follow/${item.rkey}`);
	}
	return followUris;
}

async function whenFollowsIndexed(
	appview: Client,
	actor: string,
	fn: (res: { follows: unknown[] }) => boolean,
) {
	await until(5, 1e3, fn, () =>
		ok(
			appview.get('app.bsky.graph.getFollows', {
				params: { actor: actor as ActorIdentifier, limit: 1 },
			}),
		),
	);
}
