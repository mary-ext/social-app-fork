import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation } from '@tanstack/react-query';

import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import type { Shadow } from '#/state/cache/types';
import { getClients } from '#/state/session';
import { setThreadMute, useIsThreadMuted } from '#/state/thread-mutes';

export function useThreadMuteMutationQueue(post: Shadow<AppBskyFeedDefs.PostView>, rootUri: ResourceUri) {
	const threadMuteMutation = useThreadMuteMutation();
	const threadUnmuteMutation = useThreadUnmuteMutation();
	const isThreadMuted = useIsThreadMuted(rootUri, post.viewer?.threadMuted);

	const queueToggle = useToggleMutationQueue<boolean>({
		initialState: isThreadMuted,
		runMutation: async (_prev, shouldMute) => {
			if (shouldMute) {
				await threadMuteMutation.mutateAsync({
					uri: rootUri,
				});
				return true;
			} else {
				await threadUnmuteMutation.mutateAsync({
					uri: rootUri,
				});
				return false;
			}
		},
		onSuccess(finalIsMuted) {
			// finalize
			setThreadMute(rootUri, finalIsMuted);
		},
	});

	const queueMuteThread = () => {
		// optimistically update
		setThreadMute(rootUri, true);
		return queueToggle(true);
	};

	const queueUnmuteThread = () => {
		// optimistically update
		setThreadMute(rootUri, false);
		return queueToggle(false);
	};

	return [isThreadMuted, queueMuteThread, queueUnmuteThread] as const;
}

function useThreadMuteMutation() {
	const { appview } = getClients();
	return useMutation<
		void,
		Error,
		{ uri: ResourceUri } // the root post's uri
	>({
		mutationFn: async ({ uri }) => {
			await ok(
				appview.post('app.bsky.graph.muteThread', {
					as: null,
					input: { root: uri },
				}),
			);
		},
	});
}

function useThreadUnmuteMutation() {
	const { appview } = getClients();
	return useMutation<void, Error, { uri: ResourceUri }>({
		mutationFn: async ({ uri }) => {
			await ok(
				appview.post('app.bsky.graph.unmuteThread', {
					as: null,
					input: { root: uri },
				}),
			);
		},
	});
}
