import { type ComAtprotoRepoApplyWrites } from '@atcute/atproto';
import { type AnyProfileView, type AppBskyActorDefs, type AppBskyRichtextFacet } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import { type Did, type ResourceUri } from '@atcute/lexicons';
import { useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { createRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { enforceLen } from '#/lib/strings/helpers';

import { useClients, useSession } from '#/state/session';

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
}): Promise<{ uri: string; cid: string }> => {
	if (profiles.length === 0) throw new Error('No profiles given');

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
	if (!list) throw new Error('List creation failed');
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

export function useGenerateStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: ({ uri, cid }: { uri: string; cid: string }) => void;
	onError: (e: Error) => void;
}) {
	const { t: l } = useLingui();
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();

	return useMutation<{ uri: string; cid: string }, Error, void>({
		mutationFn: async () => {
			const did = currentAccount!.did as Did;
			let profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
			let profiles: AppBskyActorDefs.ProfileView[] | undefined;

			await Promise.all([
				(async () => {
					profile = await ok(appview.get('app.bsky.actor.getProfile', { params: { actor: did } }));
				})(),
				(async () => {
					const res = await ok(
						appview.get('app.bsky.actor.searchActors', {
							params: { limit: 49, q: encodeURIComponent('*') },
						}),
					);
					profiles = res.actors.filter((p) => p.viewer?.following);
				})(),
			]);

			if (!profile || !profiles) {
				throw new Error('ERROR_DATA');
			}

			// We include ourselves when we make the list
			if (profiles.length < 7) {
				throw new Error('NOT_ENOUGH_FOLLOWERS');
			}

			const displayName = enforceLen(
				profile.displayName ? sanitizeDisplayName(profile.displayName) : `@${sanitizeHandle(profile.handle)}`,
				25,
				true,
			);
			const starterPackName = l`${displayName}'s Starter Pack`;

			const list = await createStarterPackList({
				did,
				name: starterPackName,
				pds: pds!,
				profiles,
			});

			return await createRecord(pds!, {
				collection: 'app.bsky.graph.starterpack',
				record: {
					$type: 'app.bsky.graph.starterpack',
					createdAt: new Date().toISOString(),
					list: list.uri as ResourceUri,
					name: starterPackName,
				},
				repo: did,
			});
		},
		onSuccess: async (data) => {
			await whenAppViewReady(appview, data.uri, (v) => {
				return typeof v?.starterPack.uri === 'string';
			});
			onSuccess(data);
		},
		onError: (error) => {
			onError(error);
		},
	});
}

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
			list: listUri as ResourceUri,
			subject: did as Did,
		},
	};
}

async function whenAppViewReady(
	appview: Client,
	uri: string,
	fn: (res?: { starterPack: { uri: string } }) => boolean,
) {
	await until(5, 1e3, fn, () =>
		ok(appview.get('app.bsky.graph.getStarterPack', { params: { starterPack: uri as ResourceUri } })),
	);
}
