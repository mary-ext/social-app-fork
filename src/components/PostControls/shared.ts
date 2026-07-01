import { useState } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';

import type { Shadow } from '#/state/cache/types';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { usePostLikeMutationQueue, usePostRepostMutationQueue } from '#/state/queries/post';
import { useRequireAuth } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * Props shared by the post action bar in either size. The two surfaces — {@link PostControls} (feed / thread
 * rows) and {@link AnchorPostControls} (focused thread anchor) — keep their layout/sizing separate but share
 * the action wiring via {@link usePostControlsActions}.
 */
export type PostControlsProps = {
	post: Shadow<AppBskyFeedDefs.PostView>;
	feedContext?: string | undefined;
	reqId?: string | undefined;
	onPressReply: () => void;
	onPostReply?: (postUri: string | undefined) => void;
	viaRepost?: { uri: string; cid: string };
};

/**
 * The mutation queues, interaction logging, and like/repost/quote/share handlers shared by both action-bar
 * sizes. Holds no layout — the rendering components own their own sizing.
 */
export function usePostControlsActions({
	post,
	feedContext,
	reqId,
	viaRepost,
	onPostReply,
}: Pick<PostControlsProps, 'feedContext' | 'onPostReply' | 'post' | 'reqId' | 'viaRepost'>) {
	const { openComposer } = useOpenComposer();
	const { sendInteraction } = useFeedFeedbackContext();
	const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, viaRepost);
	const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(post, viaRepost);
	const requireAuth = useRequireAuth();
	const isBlocked = Boolean(
		post.author.viewer?.blocking || post.author.viewer?.blockedBy || post.author.viewer?.blockingByList,
	);
	const replyDisabled = post.viewer?.replyDisabled;

	const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] = useState(false);

	const onPressToggleLike = async () => {
		if (isBlocked) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}

		try {
			setHasLikeIconBeenToggled(true);
			if (!post.viewer?.like) {
				sendInteraction({
					item: post.uri,
					event: 'app.bsky.feed.defs#interactionLike',
					feedContext,
					reqId,
				});
				await queueLike();
			} else {
				await queueUnlike();
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				throw e;
			}
		}
	};

	const onRepost = async () => {
		if (isBlocked) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}

		try {
			if (!post.viewer?.repost) {
				sendInteraction({
					item: post.uri,
					event: 'app.bsky.feed.defs#interactionRepost',
					feedContext,
					reqId,
				});
				await queueRepost();
			} else {
				await queueUnrepost();
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				throw e;
			}
		}
	};

	const onQuote = () => {
		if (isBlocked) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}

		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#interactionQuote',
			feedContext,
			reqId,
		});
		openComposer({
			quote: post,
			onPost: onPostReply,
		});
	};

	const onShare = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#interactionShare',
			feedContext,
			reqId,
		});
	};

	return {
		hasLikeIconBeenToggled,
		onPressToggleLike,
		onQuote,
		onRepost,
		onShare,
		replyDisabled,
		requireAuth,
	};
}
