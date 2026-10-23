import type { AppBskyActorProfile } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { findRecord, putRecord } from '#/lib/api/records';
import { isInvalidSwapError } from '#/lib/errors';
import { retry } from '#/lib/utils/retry';

/**
 * reads, merges, and writes the user's own `app.bsky.actor.profile` record, retrying when the record changes
 * between the read and the write.
 *
 * @param pds the PDS client
 * @param did the user's repo DID
 * @param update maps the current record, or undefined when none exists, to the record to write, or to
 *   undefined to leave it as is. it may run more than once and must not mutate its argument
 * @returns the record as it was when last read
 */
export const updateOwnProfileRecord = async (
	pds: Client,
	did: Did,
	update: (
		existing: AppBskyActorProfile.Main | undefined,
	) => Omit<AppBskyActorProfile.Main, '$type'> | undefined,
): Promise<AppBskyActorProfile.Main | undefined> => {
	return await retry(5, isInvalidSwapError, async () => {
		const existing = await findRecord(pds, {
			repo: did,
			collection: 'app.bsky.actor.profile',
			rkey: 'self',
		});

		const next = update(existing?.value);
		if (next) {
			await putRecord(pds, {
				repo: did,
				rkey: 'self',
				record: { ...next, $type: 'app.bsky.actor.profile' },
				swapRecord: existing?.cid ?? null,
			});
		}

		return existing?.value;
	});
};
