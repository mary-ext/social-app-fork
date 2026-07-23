import type { LabelPreference } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { difference } from '@mary/array-fns';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { replaceEqualDeep } from '#/lib/functions';
import { getAppLabelers } from '#/lib/moderation/app-labelers';
import type { AppBskyActorDefs, BskyFeedViewPreference } from '#/lib/moderation/preferences-types';

import { GCTIME, STALE } from '#/state/queries';
import {
	addSavedFeeds,
	getPreferences,
	overwriteSavedFeeds,
	removeMutedWord,
	removeMutedWords,
	removeSavedFeeds,
	setAdultContentEnabled,
	setContentLabelPref,
	setFeedViewPrefs,
	setThreadViewPrefs,
	setVerificationPrefs,
	updateMutedWord,
	updateSavedFeeds,
	upsertMutedWords,
} from '#/state/queries/preferences/agent';
import {
	DEFAULT_HOME_FEED_PREFS,
	DEFAULT_LOGGED_OUT_PREFERENCES,
	DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const';
import type { ThreadViewPreferences, UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { createQueryKey } from '#/state/queries/util';
import { getClients, useSession } from '#/state/session';
import { saveLabelers } from '#/state/session/agent-config';
import { setSubscribedLabelers } from '#/state/session/labelers';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export * from '#/state/queries/preferences/const';
export * from '#/state/queries/preferences/moderation';
export * from '#/state/queries/preferences/types';

export const preferencesQueryKey = createQueryKey('getPreferences', {}, { persistedVersion: 1 });

export function usePreferencesQuery() {
	const { pds } = getClients();
	const { currentAccount } = useSession();

	const query = useQuery({
		staleTime: STALE.SECONDS.FIFTEEN,
		structuralSharing: replaceEqualDeep,
		refetchOnWindowFocus: true,
		queryKey: preferencesQueryKey,
		gcTime: GCTIME.INFINITY,
		queryFn: async () => {
			if (!pds || !currentAccount) {
				return DEFAULT_LOGGED_OUT_PREFERENCES;
			} else {
				const res = await getPreferences(pds, getAppLabelers());

				const labelerDids = res.moderationPrefs.labelers.map((l) => l.did);
				// save to local storage to ensure there are labels on initial requests
				saveLabelers(currentAccount.did, labelerDids);
				// keep the appview client's labeler header in sync with the freshly fetched prefs, as
				// `agent.getPreferences()` used to do internally
				setSubscribedLabelers(difference(labelerDids, getAppLabelers()));

				const preferences: UsePreferencesQueryResponse = {
					...res,
					savedFeeds: res.savedFeeds.filter((f) => f.type !== 'unknown'),
					/** Special preference, only used for following feed, previously called `home` */
					feedViewPrefs: {
						...DEFAULT_HOME_FEED_PREFS,
						...res.feedViewPrefs.home,
					},
					threadViewPrefs: {
						...DEFAULT_THREAD_VIEW_PREFS,
						...res.threadViewPrefs,
					},
				};
				return preferences;
			}
		},
	});

	return query;
}

export function usePreferencesSetContentLabelMutation() {
	const { pds } = getClients();
	const queryClient = useQueryClient();

	return useMutation<
		void,
		unknown,
		{ label: string; visibility: LabelPreference; labelerDid: Did | undefined }
	>({
		mutationFn: async ({ label, visibility, labelerDid }) => {
			await setContentLabelPref(pds!, label, visibility, labelerDid);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function usePreferencesSetAdultContentMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, { enabled: boolean }>({
		mutationFn: async ({ enabled }) => {
			await setAdultContentEnabled(pds!, enabled);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useSetFeedViewPreferencesMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
		mutationFn: async (prefs) => {
			/*
			 * special handling here, merged into `feedViewPrefs` above, since
			 * following was previously called `home`
			 */
			await setFeedViewPrefs(pds!, 'home', prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useSetThreadViewPreferencesMutation({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: void, variables: Partial<ThreadViewPreferences>) => void;
	onError?: (error: unknown) => void;
}) {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
		mutationFn: async (prefs) => {
			await setThreadViewPrefs(pds!, prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
		onSuccess,
		onError,
	});
}

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

/**
 * tracks whether a feed or list is in the user's saved feeds and toggles it, surfacing a toast on either
 * outcome.
 *
 * @param pin whether a freshly saved feed should also be pinned
 * @param type the saved-feed kind, `feed` for a generator or `list` for a list
 * @param uri the feed generator or list URI, matched against the saved-feeds config
 * @returns an object containing the current saved state, a pending state, and a function to toggle the save
 *   state
 */
export function useToggleSavedFeed({
	pin,
	type,
	uri,
}: {
	pin?: boolean;
	type: 'feed' | 'list';
	uri: string;
}) {
	const { data: preferences } = usePreferencesQuery();
	const { isPending: isAddPending, mutateAsync: saveFeeds } = useAddSavedFeedsMutation();
	const { isPending: isRemovePending, mutateAsync: removeFeed } = useRemoveFeedMutation();

	const savedFeedConfig = preferences?.savedFeeds?.find((feed) => feed.value === uri);

	const toggleSave = async () => {
		try {
			if (savedFeedConfig) {
				await removeFeed(savedFeedConfig);
			} else {
				await saveFeeds([{ pinned: !!pin, type, value: uri }]);
			}
			Toast.show(m['common.feeds.updatedToast']());
		} catch (err) {
			logger.error(err instanceof Error ? err : String(err), {
				message: 'failed to update saved feeds',
				pin,
			});
			Toast.show(m['state.feeds.error.update'](), { type: 'error' });
		}
	};

	return {
		isPending: isAddPending || isRemovePending,
		isSaved: !!savedFeedConfig,
		toggleSave,
	};
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
						value: PROD_DEFAULT_FEED('whats-hot'),
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

export function useUpsertMutedWordsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
			await upsertMutedWords(pds!, mutedWords);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useUpdateMutedWordMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
			await updateMutedWord(pds!, mutedWord);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useRemoveMutedWordMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
			await removeMutedWord(pds!, mutedWord);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useRemoveMutedWordsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
			await removeMutedWords(pds!, mutedWords);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useSetVerificationPrefsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, AppBskyActorDefs.VerificationPrefs>({
		mutationFn: async (prefs) => {
			await setVerificationPrefs(pds!, prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
