import type { AppBskyFeedDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useConstant } from '#/lib/hooks/use-constant';
import {
	type InteractionSettings,
	isReplyAudienceEqual,
	quotesFromEmbeddingRules,
	quotesToEmbeddingRules,
	repliesFromThreadgateView,
} from '#/lib/interaction-settings';

import { usePostgateQuery, useWritePostgateMutation } from '#/state/queries/postgate';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { useSetThreadgateAllowMutation, useThreadgateViewQuery } from '#/state/queries/threadgate';
import { useSession } from '#/state/session';

import type * as Dialog from '#/components/Dialog';

import { SettingsFlow } from './SettingsFlow';
import { SettingsLoading } from './SettingsLoading';

export type PostInteractionSettingsDialogProps = {
	handle: Dialog.DialogHandle;
	/** URI of the post to edit the interaction settings for. Could be a root post or could be a reply. */
	postUri: ResourceUri;
	/**
	 * The URI of the root post in the thread. Used to determine if the viewer owns the threadgate record and
	 * can therefore edit it.
	 */
	rootPostUri: ResourceUri;
	/**
	 * Optional initial {@link AppBskyFeedDefs.ThreadgateView} to use if we happen to have one before opening the
	 * settings dialog.
	 */
	initialThreadgateView?: AppBskyFeedDefs.ThreadgateView;
};

export function SettingsBody({
	handle,
	postUri,
	rootPostUri,
	initialThreadgateView,
}: PostInteractionSettingsDialogProps) {
	const { data: threadgateView, isLoading: isLoadingThreadgate } = useThreadgateViewQuery({
		postUri: rootPostUri,
	});
	const { data: postgate, isLoading: isLoadingPostgate } = usePostgateQuery({ postUri });

	if (isLoadingThreadgate || isLoadingPostgate) {
		return <SettingsLoading />;
	}

	return (
		<LoadedSettingsBody
			handle={handle}
			postgate={postgate ?? undefined}
			postUri={postUri}
			rootPostUri={rootPostUri}
			threadgateView={threadgateView ?? initialThreadgateView}
		/>
	);
}

function LoadedSettingsBody({
	handle,
	postgate,
	postUri,
	rootPostUri,
	threadgateView,
}: {
	handle: Dialog.DialogHandle;
	postgate: AppBskyFeedPostgate.Main | undefined;
	postUri: ResourceUri;
	rootPostUri: ResourceUri;
	threadgateView: AppBskyFeedDefs.ThreadgateView | undefined;
}) {
	const { currentAccount } = useSession();
	const { mutateAsync: writePostgateRecord } = useWritePostgateMutation();
	const { mutateAsync: setThreadgateAllow } = useSetThreadgateAllowMutation();

	// refetches must not change the baseline for detecting edits.
	const initialValue = useConstant((): InteractionSettings => ({
		allowQuotes: quotesFromEmbeddingRules(postgate?.embeddingRules),
		replies: repliesFromThreadgateView(threadgateView),
	}));

	const isThreadgateOwnedByViewer = currentAccount?.did === parseCanonicalResourceUri(rootPostUri).repo;

	const onSave = async (value: InteractionSettings) => {
		const requests: Promise<unknown>[] = [];

		if (value.allowQuotes !== initialValue.allowQuotes) {
			requests.push(
				writePostgateRecord({
					postUri,
					// changing quote permissions must preserve detached quotes.
					postgate: createPostgateRecord({
						...postgate,
						embeddingRules: quotesToEmbeddingRules(value.allowQuotes),
						post: postUri,
					}),
				}),
			);
		}

		if (isThreadgateOwnedByViewer && !isReplyAudienceEqual(value.replies, initialValue.replies)) {
			requests.push(setThreadgateAllow({ postUri: rootPostUri, replies: value.replies }));
		}

		await Promise.all(requests);
	};

	return (
		<SettingsFlow
			handle={handle}
			initialValue={initialValue}
			onSave={onSave}
			replySettingsDisabled={!isThreadgateOwnedByViewer}
		/>
	);
}
