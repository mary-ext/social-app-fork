import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import type { VideoAsset } from '#/lib/media/video/types';
import { postUriToRelativePath, toBskyAppUrl } from '#/lib/strings/url-helpers';

import { precacheResolveLinkQuery } from '#/state/queries/resolve-link';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export interface ComposerOptsPostRef {
	uri: ResourceUri;
	cid: string;
	text: string;
	langs?: string[];
	author: AppBskyActorDefs.ProfileViewBasic;
	embed?: AppBskyFeedDefs.PostView['embed'];
	moderation?: ModerationDecision;
}

export type OnPostSuccessData =
	| {
			replyToUri?: string;
			posts: AppBskyUnspeccedGetPostThreadV2.ThreadItem[];
	  }
	| undefined;

export interface ComposerOpts {
	replyTo?: ComposerOptsPostRef;
	onPost?: (postUri: string | undefined) => void;
	onPostSuccess?: (data: OnPostSuccessData) => void;
	quote?: AppBskyFeedDefs.PostView;
	mention?: string; // handle of user to mention
	text?: string;
	videoUri?: VideoAsset;
	openGallery?: boolean;
}

/**
 * registry id for the singleton composer dialog. this stable constant allows the discard flow to close all
 * other dialogs without threading an id through context.
 */
export const COMPOSER_DIALOG_ID = 'composer';

/**
 * thin imperative API over the global composer dialog (see `composerDialogHandle` in
 * `#/components/dialogs/Context`).
 */
export function useOpenComposer() {
	const { composerDialogHandle } = useGlobalDialogsHandleContext();
	const queryClient = useQueryClient();

	const openComposer = useNonReactiveCallback((opts: ComposerOpts) => {
		if (opts.quote) {
			const path = postUriToRelativePath(opts.quote.uri);
			if (path) {
				const appUrl = toBskyAppUrl(path);
				precacheResolveLinkQuery(queryClient, appUrl, {
					type: 'record',
					kind: 'post',
					record: {
						cid: opts.quote.cid,
						uri: opts.quote.uri,
					},
					view: opts.quote,
				});
			}
		}
		const author = opts.replyTo?.author || opts.quote?.author;
		const isBlocked = !!(
			author &&
			(author.viewer?.blocking || author.viewer?.blockedBy || author.viewer?.blockingByList)
		);
		if (isBlocked) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}
		// Never replace an already open composer.
		if (composerDialogHandle.isOpen) {
			return;
		}
		composerDialogHandle.openWithPayload(opts);
	});

	return { openComposer };
}

export function useComposerControls() {
	const { composerDialogHandle } = useGlobalDialogsHandleContext();

	const closeComposer = useNonReactiveCallback(() => {
		const wasOpen = composerDialogHandle.isOpen;
		if (wasOpen) {
			composerDialogHandle.close();
		}
		return wasOpen;
	});

	return { closeComposer };
}
