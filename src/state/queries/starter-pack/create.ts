import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import type { Cid, ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord } from '#/lib/api/records';

import { invalidateActorStarterPacksQuery } from '#/state/queries/starter-pack/cache';
import { resolveDescription } from '#/state/queries/starter-pack/lib/resolve-description';
import { whenAppViewReady } from '#/state/queries/starter-pack/lib/when-app-view-ready';
import { getClients, useSession } from '#/state/session';

import { createStarterPackList } from '#/features/starter-packs/generate';

/** starter pack contents, as written by the create and edit mutations. */
export interface UseCreateStarterPackMutationParams {
	name: string;
	description?: string;
	profiles: AnyProfileView[];
	feeds?: AppBskyFeedDefs.GeneratorView[];
}

export function useCreateStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: (data: { cid: Cid; uri: ResourceUri }) => void;
	onError: (e: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();

	return useMutation<{ cid: Cid; uri: ResourceUri }, Error, UseCreateStarterPackMutationParams>({
		mutationFn: async ({ name, description, feeds, profiles }) => {
			const did = currentAccount!.did;
			const { description: trimmedDescription, descriptionFacets } = await resolveDescription(
				appview,
				description,
			);

			const listRes = await createStarterPackList({
				description: trimmedDescription,
				descriptionFacets,
				did,
				name,
				pds: pds!,
				profiles,
			});

			return await createRecord(pds!, {
				repo: did,
				record: {
					$type: 'app.bsky.graph.starterpack',
					createdAt: new Date().toISOString(),
					description: trimmedDescription,
					descriptionFacets,
					feeds: feeds?.map((f) => ({ uri: f.uri })),
					list: listRes.uri,
					name,
				},
			});
		},
		onSuccess: async (data) => {
			await whenAppViewReady(appview, data.uri, (v) => {
				return typeof v?.starterPack.uri === 'string';
			});
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			onSuccess(data);
		},
		onError: (error) => {
			onError(error);
		},
	});
}
