import { useState } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { isAbortError } from '#/lib/errors';
import { useKeybind } from '#/lib/keybinds';
import { profileTarget } from '#/lib/routes/targets';

import type { Shadow } from '#/state/cache/types';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { usePostLikeMutationQueue, usePostRepostMutationQueue } from '#/state/queries/post';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { useOpenComposer } from '#/features/composer/open-composer';

import { useRequireAuth } from '#/components/hooks/use-require-auth';
import { KEYBINDS } from '#/components/keybind-catalog';
import * as Toast from '#/components/Toast';
import { navigateTo } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

/** props shared by the post action bar in either size. */
export type PostControlsProps = {
	post: Shadow<AppBskyFeedDefs.PostView>;
	feedContext?: string | undefined;
	reqId?: string | undefined;
	onPressReply: () => void;
	/** enable only for the post containing focus. */
	keybindsEnabled?: boolean;
	viaRepost?: { uri: ResourceUri; cid: string };
};

/**
 * shares post actions and keybinds between compact and anchor controls.
 *
 * @param props post data and action-bar options
 * @returns action handlers, control state, and an auth guard
 */
export function usePostControlsActions({
	post,
	feedContext,
	reqId,
	onPressReply,
	keybindsEnabled,
	viaRepost,
}: Omit<PostControlsProps, 'keybindsEnabled'> & { keybindsEnabled: boolean }) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { openComposer } = useOpenComposer();
	const { sendInteraction } = useFeedFeedbackContext();
	const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, viaRepost);
	const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(post, viaRepost);
	const requireAuth = useRequireAuth();
	const isBlocked = !!(
		post.author.viewer?.blocking ||
		post.author.viewer?.blockedBy ||
		post.author.viewer?.blockingByList
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
			if (!isAbortError(err)) {
				throw err;
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
			if (!isAbortError(err)) {
				throw err;
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
		});
	};

	useKeybind({
		keybind: KEYBINDS.like,
		enabled: keybindsEnabled,
		handle() {
			requireAuth(() => onPressToggleLike());
		},
	});

	useKeybind({
		keybind: KEYBINDS.reply,
		enabled: keybindsEnabled && !replyDisabled,
		handle() {
			requireAuth(() => onPressReply());
		},
	});

	useKeybind({
		keybind: KEYBINDS.repost,
		enabled: keybindsEnabled,
		handle() {
			requireAuth(() => void onRepost());
		},
	});

	useKeybind({
		keybind: KEYBINDS.quote,
		enabled: keybindsEnabled && !post.viewer?.embeddingDisabled,
		handle() {
			requireAuth(() => onQuote());
		},
	});

	useKeybind({
		keybind: KEYBINDS.viewAuthor,
		enabled: keybindsEnabled,
		handle() {
			sendInteraction({
				item: post.uri,
				event: 'app.bsky.feed.defs#clickthroughAuthor',
				feedContext,
				reqId,
			});
			unstableCacheProfileView(queryClient, post.author);
			navigateTo(router, router.href(profileTarget(post.author.did)), 'push');
		},
	});

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
