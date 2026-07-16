import { useCallback } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Handle, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri, parseResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { useToggleMutationQueue } from '#/lib/hooks/useToggleMutationQueue';

import { updatePostShadow } from '#/state/cache/post-shadow';
import type { Shadow } from '#/state/cache/types';
import { useClients, useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';

import { useIsThreadMuted, useSetThreadMute } from '../cache/thread-mutes';

const RQKEY_ROOT = 'post';
export const RQKEY = (postUri: string) => [RQKEY_ROOT, postUri];

export function usePostQuery(uri: string | undefined) {
	const { appview } = useClients();
	return useQuery<AppBskyFeedDefs.PostView>({
		queryKey: RQKEY(uri || ''),
		queryFn: async () => {
			if (!uri) throw new Error('[unreachable] No URI provided');

			const urip = parseResourceUri(uri);

			let repo: string = urip.repo;
			if (!repo.startsWith('did:')) {
				const resolved = await ok(
					appview.get('com.atproto.identity.resolveHandle', {
						params: { handle: repo as Handle },
					}),
				);
				repo = resolved.did;
			}

			const { posts } = await ok(
				appview.get('app.bsky.feed.getPosts', {
					params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}` as ResourceUri] },
				}),
			);
			if (posts[0]) {
				return posts[0];
			}

			throw new Error('No data');
		},
		enabled: !!uri,
	});
}

export function useGetPost() {
	const queryClient = useQueryClient();
	const { appview } = useClients();
	return useCallback(
		async ({ uri }: { uri: string }) => {
			return queryClient.fetchQuery({
				queryKey: RQKEY(uri || ''),
				async queryFn() {
					const urip = parseResourceUri(uri);

					let repo: string = urip.repo;
					if (!repo.startsWith('did:')) {
						const resolved = await ok(
							appview.get('com.atproto.identity.resolveHandle', {
								params: { handle: repo as Handle },
							}),
						);
						repo = resolved.did;
					}

					const { posts } = await ok(
						appview.get('app.bsky.feed.getPosts', {
							params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}` as ResourceUri] },
						}),
					);

					if (posts[0]) {
						return posts[0];
					}

					throw new Error('useGetPost: post not found');
				},
			});
		},
		[queryClient, appview],
	);
}

export function useGetPosts() {
	const queryClient = useQueryClient();
	const { appview } = useClients();
	return useCallback(
		async ({ uris }: { uris: string[] }) => {
			return queryClient.fetchQuery({
				queryKey: RQKEY(uris.join(',') || ''),
				async queryFn() {
					const { posts } = await ok(
						appview.get('app.bsky.feed.getPosts', {
							params: { uris: uris as ResourceUri[] },
						}),
					);
					return posts;
				},
			});
		},
		[queryClient, appview],
	);
}

export function usePostLikeMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: string; cid: string } | undefined,
) {
	const queryClient = useQueryClient();
	const postUri = post.uri;
	const postCid = post.cid;
	const initialLikeUri = post.viewer?.like;
	const likeMutation = usePostLikeMutation();
	const unlikeMutation = usePostUnlikeMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialLikeUri,
		runMutation: async (prevLikeUri, shouldLike) => {
			if (shouldLike) {
				const { uri: likeUri } = await likeMutation.mutateAsync({
					uri: postUri,
					cid: postCid,
					via: viaRepost,
				});
				userActionHistory.like([postUri]);
				return likeUri as ResourceUri;
			} else {
				if (prevLikeUri) {
					await unlikeMutation.mutateAsync({
						postUri: postUri,
						likeUri: prevLikeUri,
					});
					userActionHistory.unlike([postUri]);
				}
				return undefined;
			}
		},
		onSuccess(finalLikeUri) {
			// finalize
			updatePostShadow(queryClient, postUri, {
				likeUri: finalLikeUri,
			});
		},
	});

	const queueLike = useCallback(() => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: 'pending',
		});
		return queueToggle(true);
	}, [queryClient, postUri, queueToggle]);

	const queueUnlike = useCallback(() => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: undefined,
		});
		return queueToggle(false);
	}, [queryClient, postUri, queueToggle]);

	return [queueLike, queueUnlike] as const;
}

function usePostLikeMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: string }, // responds with the uri of the like
		Error,
		{ uri: string; cid: string; via?: { uri: string; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				collection: 'app.bsky.feed.like',
				record: {
					$type: 'app.bsky.feed.like',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri as ResourceUri },
					via: via && { cid: via.cid, uri: via.uri as ResourceUri },
				},
				repo: currentAccount!.did,
			});
		},
	});
}

function usePostUnlikeMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; likeUri: string }>({
		mutationFn: ({ postUri: _postUri, likeUri }) => {
			return deleteRecord(pds!, {
				collection: 'app.bsky.feed.like',
				repo: currentAccount!.did,
				rkey: parseCanonicalResourceUri(likeUri).rkey,
			});
		},
	});
}

export function usePostRepostMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: string; cid: string } | undefined,
) {
	const queryClient = useQueryClient();
	const postUri = post.uri;
	const postCid = post.cid;
	const initialRepostUri = post.viewer?.repost;
	const repostMutation = usePostRepostMutation();
	const unrepostMutation = usePostUnrepostMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialRepostUri,
		runMutation: async (prevRepostUri, shouldRepost) => {
			if (shouldRepost) {
				const { uri: repostUri } = await repostMutation.mutateAsync({
					uri: postUri,
					cid: postCid,
					via: viaRepost,
				});
				return repostUri as ResourceUri;
			} else {
				if (prevRepostUri) {
					await unrepostMutation.mutateAsync({
						postUri: postUri,
						repostUri: prevRepostUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalRepostUri) {
			// finalize
			updatePostShadow(queryClient, postUri, {
				repostUri: finalRepostUri,
			});
		},
	});

	const queueRepost = useCallback(() => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: 'pending',
		});
		return queueToggle(true);
	}, [queryClient, postUri, queueToggle]);

	const queueUnrepost = useCallback(() => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: undefined,
		});
		return queueToggle(false);
	}, [queryClient, postUri, queueToggle]);

	return [queueRepost, queueUnrepost] as const;
}

function usePostRepostMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: string }, // responds with the uri of the repost
		Error,
		{ uri: string; cid: string; via?: { uri: string; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				collection: 'app.bsky.feed.repost',
				record: {
					$type: 'app.bsky.feed.repost',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri as ResourceUri },
					via: via && { cid: via.cid, uri: via.uri as ResourceUri },
				},
				repo: currentAccount!.did,
			});
		},
	});
}

function usePostUnrepostMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; repostUri: string }>({
		mutationFn: ({ postUri: _postUri, repostUri }) => {
			return deleteRecord(pds!, {
				collection: 'app.bsky.feed.repost',
				repo: currentAccount!.did,
				rkey: parseCanonicalResourceUri(repostUri).rkey,
			});
		},
	});
}

export function usePostDeleteMutation() {
	const queryClient = useQueryClient();
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { uri: string }>({
		mutationFn: async ({ uri }) => {
			await deleteRecord(pds!, {
				collection: 'app.bsky.feed.post',
				repo: currentAccount!.did,
				rkey: parseCanonicalResourceUri(uri).rkey,
			});
		},
		onSuccess(_, variables) {
			updatePostShadow(queryClient, variables.uri, { isDeleted: true });
		},
	});
}

export function useThreadMuteMutationQueue(post: Shadow<AppBskyFeedDefs.PostView>, rootUri: string) {
	const threadMuteMutation = useThreadMuteMutation();
	const threadUnmuteMutation = useThreadUnmuteMutation();
	const isThreadMuted = useIsThreadMuted(rootUri, post.viewer?.threadMuted);
	const setThreadMute = useSetThreadMute();

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

	const queueMuteThread = useCallback(() => {
		// optimistically update
		setThreadMute(rootUri, true);
		return queueToggle(true);
	}, [setThreadMute, rootUri, queueToggle]);

	const queueUnmuteThread = useCallback(() => {
		// optimistically update
		setThreadMute(rootUri, false);
		return queueToggle(false);
	}, [rootUri, setThreadMute, queueToggle]);

	return [isThreadMuted, queueMuteThread, queueUnmuteThread] as const;
}

function useThreadMuteMutation() {
	const { appview } = useClients();
	return useMutation<
		void,
		Error,
		{ uri: string } // the root post's uri
	>({
		mutationFn: async ({ uri }) => {
			await ok(
				appview.post('app.bsky.graph.muteThread', {
					as: null,
					input: { root: uri as ResourceUri },
				}),
			);
		},
	});
}

function useThreadUnmuteMutation() {
	const { appview } = useClients();
	return useMutation<void, Error, { uri: string }>({
		mutationFn: async ({ uri }) => {
			await ok(
				appview.post('app.bsky.graph.unmuteThread', {
					as: null,
					input: { root: uri as ResourceUri },
				}),
			);
		},
	});
}
