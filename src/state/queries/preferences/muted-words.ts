import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import {
	removeMutedWord,
	removeMutedWords,
	updateMutedWord,
	upsertMutedWords,
} from '#/state/queries/preferences/lib/muted-words';
import { getClients } from '#/state/session';

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
