import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bskyFeedUri } from '#/lib/constants/feeds';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import {
	addSavedFeeds,
	overwriteSavedFeeds,
	removeSavedFeeds,
	updateSavedFeeds,
} from '#/state/queries/preferences/lib/saved-feeds';
import { getClients } from '#/state/session';

export function useOverwriteSavedFeedsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
		mutationFn: async (savedFeeds) => {
			await overwriteSavedFeeds(pds!, savedFeeds);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useAddSavedFeedsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Pick<AppBskyActorDefs.SavedFeed, 'type' | 'value' | 'pinned'>[]>({
		mutationFn: async (savedFeeds) => {
			await addSavedFeeds(pds!, savedFeeds);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useRemoveFeedMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Pick<AppBskyActorDefs.SavedFeed, 'id'>>({
		mutationFn: async (savedFeed) => {
			await removeSavedFeeds(pds!, [savedFeed.id]);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useReplaceForYouWithDiscoverFeedMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		mutationFn: async ({
			forYouFeedConfig,
			discoverFeedConfig,
		}: {
			forYouFeedConfig: AppBskyActorDefs.SavedFeed | undefined;
			discoverFeedConfig: AppBskyActorDefs.SavedFeed | undefined;
		}) => {
			if (forYouFeedConfig) {
				await removeSavedFeeds(pds!, [forYouFeedConfig.id]);
			}
			if (!discoverFeedConfig) {
				await addSavedFeeds(pds!, [
					{
						type: 'feed',
						value: bskyFeedUri('whats-hot'),
						pinned: true,
					},
				]);
			} else {
				await updateSavedFeeds(pds!, [
					{
						...discoverFeedConfig,
						pinned: true,
					},
				]);
			}
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useUpdateSavedFeedsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
		mutationFn: async (feeds) => {
			await updateSavedFeeds(pds!, feeds);

			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
