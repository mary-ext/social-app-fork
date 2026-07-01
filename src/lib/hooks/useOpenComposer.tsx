import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';
import { useQueryClient } from '@tanstack/react-query';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import type { VideoAsset } from '#/lib/media/video/types';
import { postUriToRelativePath, toBskyAppUrl } from '#/lib/strings/url-helpers';

import { precacheResolveLinkQuery } from '#/state/queries/resolve-link';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export interface ComposerOptsPostRef {
	uri: string;
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
 * Registry id for the singleton composer dialog. A stable constant (rather than a `useId`) so the discard
 * flow can `closeAllDialogs({ except: [COMPOSER_DIALOG_ID] })` without threading an id through context.
 */
export const COMPOSER_DIALOG_ID = 'composer';

/**
 * The composer is a global ALF dialog (see `composerDialogControl` in `#/components/dialogs/Context`); these
 * hooks are the thin imperative API over that control.
 */
export function useOpenComposer() {
	const { composerDialogControl } = useGlobalDialogsControlContext();
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
		const isBlocked = Boolean(
			author && (author.viewer?.blocking || author.viewer?.blockedBy || author.viewer?.blockingByList),
		);
		if (isBlocked) {
			Toast.show(m['common.block.interactionError'](), {
				type: 'warning',
			});
			return;
		}
		// Never replace an already open composer.
		if (composerDialogControl.isOpen) {
			return;
		}
		composerDialogControl.openWithPayload(opts);
	});

	return { openComposer };
}

export function useComposerControls() {
	const { composerDialogControl } = useGlobalDialogsControlContext();

	const closeComposer = useNonReactiveCallback(() => {
		const wasOpen = composerDialogControl.isOpen;
		if (wasOpen) {
			composerDialogControl.close();
		}
		return wasOpen;
	});

	return { closeComposer };
}
