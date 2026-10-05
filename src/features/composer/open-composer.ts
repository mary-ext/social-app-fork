import type { AppBskyFeedDefs, AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { RQKEY as RQKEY_POST } from '#/state/queries/post';

import * as Dialog from '#/components/Dialog';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import type { VideoAsset } from './media/video-asset';

export type OnPostSuccessData = {
	replyToUri?: string;
	posts: AppBskyUnspeccedGetPostThreadV2.ThreadItem[];
};

export interface ComposerOpts {
	onPostSuccess?: (data: OnPostSuccessData) => void;
	quote?: AppBskyFeedDefs.PostView;
	replyTo?: AppBskyFeedDefs.PostView;
	text?: string;
	video?: VideoAsset;
}

/** global composer handle; open through {@link useOpenComposer}. */
export const composerDialogHandle = Dialog.createHandle<ComposerOpts>();

/** prevents reply and quote previews from refetching cached posts. publishing fetches a fresh reply parent. */
export const PREVIEW_STALE_TIME = Infinity;

/**
 * provides an opener for the global composer.
 *
 * @returns openComposer, which ignores requests while open or when a block prevents interaction
 */
export function useOpenComposer() {
	const queryClient = useQueryClient();

	const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
		const viewer = (opts.replyTo ?? opts.quote)?.author.viewer;
		if (viewer?.blocking || viewer?.blockedBy || viewer?.blockingByList) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}
		if (composerDialogHandle.isOpen) {
			return;
		}
		// seed the URI queries so previews render immediately.
		for (const post of [opts.quote, opts.replyTo]) {
			if (post) {
				queryClient.setQueryData(RQKEY_POST(post.uri), post);
			}
		}
		composerDialogHandle.openWithPayload(opts);
	});

	return { openComposer };
}

/** closes the global composer without raising its discard prompt. */
export function closeComposer(): void {
	if (composerDialogHandle.isOpen) {
		composerDialogHandle.close();
	}
}
