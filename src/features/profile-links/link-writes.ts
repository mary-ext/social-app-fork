import type { ComAtprotoRepoApplyWrites, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyActorLink } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';

import { computeRecordCid } from '#/lib/api/record-cid';
import { findRecord, uploadBlob } from '#/lib/api/records';

import { sameLinkContent } from './record';
import type { ProfileLink, SavedProfileLink } from './types';

const LINK_COLLECTION = 'app.bsky.actor.link';

type LinkRef = ComAtprotoRepoStrongRef.Main;
type RepoWrite = ComAtprotoRepoApplyWrites.$input['writes'][number];

/** link refs and their pending record writes. */
export type LinkWrites = {
	/** refs for the profile's `links` field, in display order. */
	refs: LinkRef[];
	writes: RepoWrite[];
};

const resolveIcon = async (
	pds: Client,
	did: Did,
	link: ProfileLink,
	rkey: string | undefined,
): Promise<{ exists: boolean; icon: AppBskyActorLink.Main['icon'] }> => {
	const exists = rkey !== undefined;
	const icon = link.icon;
	if (!icon) {
		return { exists, icon: undefined };
	}

	switch (icon.kind) {
		case 'fetched': {
			return { exists, icon: await uploadBlob(pds, icon.image) };
		}
		case 'stored': {
			// recover the blob ref that the profile view omits.
			if (rkey === undefined) {
				return { exists, icon: undefined };
			}
			const stored = await findRecord(pds, { repo: did, collection: LINK_COLLECTION, rkey });
			return { exists: stored !== undefined, icon: stored?.value.icon };
		}
	}
};

/**
 * uploads new favicons and prepares link changes without writing records. apply the returned writes and
 * profile refs in one commit.
 *
 * @param pds the PDS client
 * @param did the owner's repo DID
 * @param links the links as loaded and as they should be saved
 * @returns link refs and pending writes
 */
export const prepareLinkWrites = async (
	pds: Client,
	did: Did,
	{ existing, next }: { existing: SavedProfileLink[]; next: ProfileLink[] },
): Promise<LinkWrites> => {
	const existingByUri = new Map(existing.map((link) => [link.record.uri, link]));

	const planned = await Promise.all(
		next.map(async (link): Promise<{ ref: LinkRef; write?: RepoWrite }> => {
			const before = link.record ? existingByUri.get(link.record.uri) : undefined;
			if (before && sameLinkContent(before, link)) {
				return { ref: before.record };
			}

			// preserve URIs so existing reports still identify the link.
			const beforeRkey = before && parseCanonicalResourceUri(before.record.uri).rkey;
			const { exists, icon } = await resolveIcon(pds, did, link, beforeRkey);
			const rkey = beforeRkey ?? TID.now();

			const value = {
				$type: LINK_COLLECTION,
				createdAt: new Date().toISOString(),
				icon,
				title: link.title,
				url: link.url,
			} satisfies AppBskyActorLink.Main;

			const uri: ResourceUri = `at://${did}/${LINK_COLLECTION}/${rkey}`;
			return {
				ref: { uri, cid: await computeRecordCid(value) },
				write: {
					// recreate records found missing during icon lookup.
					$type: exists ? 'com.atproto.repo.applyWrites#update' : 'com.atproto.repo.applyWrites#create',
					collection: LINK_COLLECTION,
					rkey,
					value,
				},
			};
		}),
	);

	const refs = planned.map((plan) => plan.ref);
	const kept = new Set<string>(refs.map((ref) => ref.uri));
	const writes = planned.flatMap((plan) => (plan.write ? [plan.write] : []));
	for (const link of existing) {
		if (!kept.has(link.record.uri)) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#delete',
				collection: LINK_COLLECTION,
				rkey: parseCanonicalResourceUri(link.record.uri).rkey,
			});
		}
	}

	return { refs, writes };
};
