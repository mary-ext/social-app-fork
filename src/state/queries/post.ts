import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';
import { isDid, parseCanonicalResourceUri, parseResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';

import { updatePostShadow } from '#/state/cache/post-shadow';
import type { Shadow } from '#/state/cache/types';
import { useToggleMutationQueue } from '#/state/queries/toggle-mutation-queue';
import { getClients, useSession } from '#/state/session';
import { setThreadMute, useIsThreadMuted } from '#/state/thread-mutes';

const RQKEY_ROOT = 'post';
export const RQKEY = (postUri: string) => [RQKEY_ROOT, postUri];

export function usePostQuery(uri: ResourceUri | undefined) {
	const { appview } = getClients();
	return useQuery<AppBskyFeedDefs.PostView>({
		queryKey: RQKEY(uri || ''),
		enabled: !!uri,
		queryFn: async ({ signal }) => {
			if (!uri) {
				throw new Error('[unreachable] No URI provided');
			}

			const urip = parseResourceUri(uri);

			let repo: ActorIdentifier = urip.repo;
			if (!isDid(repo)) {
				const resolved = await ok(
					appview.get('com.atproto.identity.resolveHandle', {
						signal,
						params: { handle: repo },
					}),
				);
				repo = resolved.did;
			}

			const { posts } = await ok(
				appview.get('app.bsky.feed.getPosts', {
					signal,
					params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}`] },
				}),
			);
			if (posts[0]) {
				return posts[0];
			}

			throw new Error('No data');
		},
	});
}

export function useGetPost() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return async ({ uri }: { uri: ResourceUri }) => {
		return queryClient.fetchQuery({
			queryKey: RQKEY(uri || ''),
			async queryFn({ signal }) {
				const urip = parseResourceUri(uri);

				let repo: ActorIdentifier = urip.repo;
				if (!isDid(repo)) {
					const resolved = await ok(
						appview.get('com.atproto.identity.resolveHandle', {
							signal,
							params: { handle: repo },
						}),
					);
					repo = resolved.did;
				}

				const { posts } = await ok(
					appview.get('app.bsky.feed.getPosts', {
						signal,
						params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}`] },
					}),
				);

				if (posts[0]) {
					return posts[0];
				}

				throw new Error('useGetPost: post not found');
			},
		});
	};
}

export function useGetPosts() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return async ({ uris }: { uris: ResourceUri[] }) => {
		return queryClient.fetchQuery({
			queryKey: RQKEY(uris.join(',') || ''),
			async queryFn({ signal }) {
				const { posts } = await ok(
					appview.get('app.bsky.feed.getPosts', {
						signal,
						params: { uris },
					}),
				);
				return posts;
			},
		});
	};
}

export function usePostLikeMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: ResourceUri; cid: string } | undefined,
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
				return likeUri;
			} else {
				if (prevLikeUri) {
					await unlikeMutation.mutateAsync({
						postUri: postUri,
						likeUri: prevLikeUri,
					});
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

	const queueLike = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnlike = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueLike, queueUnlike] as const;
}

function usePostLikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: ResourceUri }, // responds with the uri of the like
		Error,
		{ uri: ResourceUri; cid: string; via?: { uri: ResourceUri; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.like',
				record: {
					$type: 'app.bsky.feed.like',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri },
					via: via && { cid: via.cid, uri: via.uri },
				},
			});
		},
	});
}

function usePostUnlikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; likeUri: string }>({
		mutationFn: ({ postUri: _postUri, likeUri }) => {
			return deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.like',
				rkey: parseCanonicalResourceUri(likeUri).rkey,
			});
		},
	});
}

export function usePostRepostMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: ResourceUri; cid: string } | undefined,
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
				return repostUri;
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

	const queueRepost = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnrepost = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueRepost, queueUnrepost] as const;
}

function usePostRepostMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: ResourceUri }, // responds with the uri of the repost
		Error,
		{ uri: ResourceUri; cid: string; via?: { uri: ResourceUri; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.repost',
				record: {
					$type: 'app.bsky.feed.repost',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri },
					via: via && { cid: via.cid, uri: via.uri },
				},
			});
		},
	});
}

function usePostUnrepostMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; repostUri: string }>({
		mutationFn: ({ postUri: _postUri, repostUri }) => {
			return deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.repost',
				rkey: parseCanonicalResourceUri(repostUri).rkey,
			});
		},
	});
}

export function usePostDeleteMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { uri: string }>({
		mutationFn: async ({ uri }) => {
			await deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.post',
				rkey: parseCanonicalResourceUri(uri).rkey,
			});
		},
		onSuccess(_, variables) {
			updatePostShadow(queryClient, variables.uri, { isDeleted: true });
		},
	});
}

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
