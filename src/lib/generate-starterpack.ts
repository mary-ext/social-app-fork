import type { ComAtprotoRepoApplyWrites } from '@atcute/atproto';
import type { AnyProfileView, AppBskyRichtextFacet } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Cid, Did, ResourceUri } from '@atcute/lexicons';

import { createRecord } from '#/lib/api/records';

export const createStarterPackList = async ({
	name,
	description,
	descriptionFacets,
	profiles,
	did,
	pds,
}: {
	name: string;
	description?: string;
	descriptionFacets?: AppBskyRichtextFacet.Main[];
	profiles: AnyProfileView[];
	did: Did;
	pds: Client;
}): Promise<{ cid: Cid; uri: ResourceUri }> => {
	if (profiles.length === 0) {
		throw new Error('No profiles given');
	}

	const list = await createRecord(pds, {
		collection: 'app.bsky.graph.list',
		record: {
			$type: 'app.bsky.graph.list',
			avatar: undefined,
			createdAt: new Date().toISOString(),
			description,
			descriptionFacets,
			name,
			purpose: 'app.bsky.graph.defs#referencelist',
		},
		repo: did,
	});
	if (!list) {
		throw new Error('List creation failed');
	}
	await ok(
		pds.post('com.atproto.repo.applyWrites', {
			input: {
				repo: did,
				writes: profiles.map((p) => createListItem({ did: p.did, listUri: list.uri })),
			},
		}),
	);

	return list;
};

function createListItem({
	did,
	listUri,
}: {
	did: string;
	listUri: string;
}): ComAtprotoRepoApplyWrites.$input['writes'][number] {
	return {
		$type: 'com.atproto.repo.applyWrites#create',
		collection: 'app.bsky.graph.listitem',
		value: {
			$type: 'app.bsky.graph.listitem',
			createdAt: new Date().toISOString(),
			list: listUri,
			subject: did,
		},
	};
}
