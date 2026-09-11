import type { ComAtprotoRepoApplyWrites, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';

import { chunked } from '@mary/array-fns';

import { isAbortError } from '#/lib/errors';
import type { RateLimitBudget } from '#/lib/rate-limit-budget';
import { until } from '#/lib/utils/until';

/** keep batches below applyWrites' 200-write limit. */
const APPLY_WRITES_BATCH_SIZE = 50;

const applyWrites = async (pds: Client, did: Did, writes: ComAtprotoRepoApplyWrites.$input['writes']) => {
	for (const batch of chunked(writes, APPLY_WRITES_BATCH_SIZE)) {
		await ok(pds.post('com.atproto.repo.applyWrites', { input: { repo: did, writes: batch } }));
	}
};

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
	dids: Did[],
	via?: ComAtprotoRepoStrongRef.Main,
) {
	const items = dids.map((d) => ({ did: d, rkey: TID.now() }));

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

	await applyWrites(pds, did, followWrites);
	await whenFollowsIndexed(appview, did, (res) => !!res.follows.length);

	const followUris = new Map<string, string>();
	for (const item of items) {
		followUris.set(item.did, `at://${did}/app.bsky.graph.follow/${item.rkey}`);
	}
	return followUris;
}

/**
 * deletes follow records in batches, continuing after failed batches without retrying them.
 *
 * may wait for rate limit resets between batches. cancellation preserves completed deletions.
 *
 * @param context PDS client, repo DID, and shared rate limit budget.
 * @param uris follow record URIs in the repo.
 * @param options callback receiving deleted URIs after each successful batch, and cancellation signal.
 * @throws {AggregateError} after all batches are attempted if any failed; successful batches remain deleted.
 * @throws the signal's reason when cancelled.
 */
export async function bulkDeleteFollows(
	{ budget, did, pds }: { budget: RateLimitBudget; did: Did; pds: Client },
	uris: readonly ResourceUri[],
	{ onDeleted, signal }: { onDeleted: (uris: readonly ResourceUri[]) => void; signal: AbortSignal },
): Promise<void> {
	const errors: unknown[] = [];

	for (const batch of chunked(uris, APPLY_WRITES_BATCH_SIZE)) {
		const writes: ComAtprotoRepoApplyWrites.$input['writes'] = batch.map((uri) => ({
			$type: 'com.atproto.repo.applyWrites#delete',
			collection: 'app.bsky.graph.follow',
			rkey: parseCanonicalResourceUri(uri).rkey,
		}));

		try {
			await ok(
				budget.attempt({
					pacing: 'bulk',
					request: () => pds.post('com.atproto.repo.applyWrites', { input: { repo: did, writes }, signal }),
					signal,
				}),
			);
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}
			errors.push(error);
			continue;
		}
		onDeleted(batch);
	}

	if (errors.length > 0) {
		throw new AggregateError(errors, `Some follow deletion batches failed`);
	}
}

async function whenFollowsIndexed(
	appview: Client,
	actor: ActorIdentifier,
	fn: (res: { follows: unknown[] }) => boolean,
) {
	await until(5, 1e3, fn, () =>
		ok(
			appview.get('app.bsky.graph.getFollows', {
				params: { actor, limit: 1 },
			}),
		),
	);
}
