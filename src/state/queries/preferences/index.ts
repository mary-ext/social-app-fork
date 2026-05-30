import {
	BskyAgent,
	type AppBskyActorDefs,
	type BskyFeedViewPreference,
	type LabelPreference,
} from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { replaceEqualDeep } from '#/lib/functions';
import { getAge } from '#/lib/strings/time';

import { GCTIME, STALE } from '#/state/queries';
import {
	addSavedFeeds,
	clearPreferences,
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
import {
	type ThreadViewPreferences,
	type UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types';
import { createQueryKey } from '#/state/queries/util';
import { useAgent, useClients, useSession } from '#/state/session';
import { saveLabelers } from '#/state/session/agent-config';

export * from '#/state/queries/preferences/const';
export * from '#/state/queries/preferences/moderation';
export * from '#/state/queries/preferences/types';

export const preferencesQueryKey = createQueryKey('getPreferences', {}, { persistedVersion: 1 });

export function usePreferencesQuery() {
	const agent = useAgent();
	const { pds } = useClients();
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
				const res = await getPreferences(pds, BskyAgent.appLabelers);

				const labelerDids = res.moderationPrefs.labelers.map((l) => l.did);
				// save to local storage to ensure there are labels on initial requests
				void saveLabelers(currentAccount.did, labelerDids);
				// keep the agent's labeler header in sync with the freshly fetched prefs, as
				// `agent.getPreferences()` used to do internally
				agent.configureLabelers(labelerDids.filter((did) => !BskyAgent.appLabelers.includes(did)));

				const preferences: UsePreferencesQueryResponse = {
					...res,
					savedFeeds: res.savedFeeds.filter((f) => f.type !== 'unknown'),
					/** Special preference, only used for following feed, previously called `home` */
					feedViewPrefs: {
						...DEFAULT_HOME_FEED_PREFS,
						...(res.feedViewPrefs.home || {}),
					},
					threadViewPrefs: {
						...DEFAULT_THREAD_VIEW_PREFS,
						...(res.threadViewPrefs ?? {}),
					},
					userAge: res.birthDate ? getAge(res.birthDate) : undefined,
				};
				return preferences;
			}
		},
	});

	if (query.data?.birthDate) {
		/** The persisted query cache stores dates as strings, but our code expects a `Date`. */
		query.data.birthDate = new Date(query.data.birthDate);
	}

	return query;
}

export function useClearPreferencesMutation() {
	const queryClient = useQueryClient();
	const { pds } = useClients();

	return useMutation({
		mutationFn: async () => {
			await clearPreferences(pds!);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function usePreferencesSetContentLabelMutation() {
	const { pds } = useClients();
	const queryClient = useQueryClient();

	return useMutation<
		void,
		unknown,
		{ label: string; visibility: LabelPreference; labelerDid: string | undefined }
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

export function useSetContentLabelMutation() {
	const queryClient = useQueryClient();
	const { pds } = useClients();

	return useMutation({
		mutationFn: async ({
			label,
			visibility,
			labelerDid,
		}: {
			label: string;
			visibility: LabelPreference;
			labelerDid?: string;
		}) => {
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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
	const { pds } = useClients();

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
