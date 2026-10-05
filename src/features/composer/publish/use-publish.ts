import type { AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { isNetworkError } from '#/lib/errors';
import { postUriToTarget } from '#/lib/routes/targets';
import { retry } from '#/lib/utils/retry';

import { postCreated } from '#/state/events';
import { savePublishedPostLanguages, usePostLanguage } from '#/state/preferences/languages';
import { getClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import { type PublishTask, useComposer, useEditorState, useThreadInteraction } from '../context';
import { deletePublishedDraft } from '../drafts/queries';
import { useFailedUploads } from '../media/uploads/upload-status';
import { closeComposer } from '../open-composer';
import { useStore } from '../shared/store';
import { getPublishBlocker, type PublishBlocker } from './blocker';
import { publishThread } from './publish-thread';
import { PublishError } from './resolve-post';
import { getPlannedVideos, snapshotThread } from './snapshot';

// the app view indexes new posts with a short delay.
const fetchPublishedThread = (
	appview: Client,
	uri: ResourceUri,
	count: number,
): Promise<AppBskyUnspeccedGetPostThreadV2.ThreadItem[]> => {
	return retry(
		5,
		() => true,
		async () => {
			const { thread } = await ok(
				appview.get('app.bsky.unspecced.getPostThreadV2', {
					params: { anchor: uri, above: false, below: count - 1, branchingFactor: 1 },
				}),
			);
			if (
				thread.length !== count ||
				!thread.every((item) => item.value.$type === 'app.bsky.unspecced.defs#threadItemPost')
			) {
				throw new Error(`app view hasn't indexed the thread yet`);
			}
			return thread;
		},
		1e3,
	);
};

/**
 * publishes the composer's thread once its videos finish uploading, then closes the composer.
 *
 * @returns why publishing is unavailable, the publish in progress, and the publish action
 */
export const usePublish = (): {
	blocker: PublishBlocker | null;
	task: PublishTask | null;
	publish: () => Promise<void>;
} => {
	const composer = useComposer();
	const interaction = useThreadInteraction();
	const postLanguage = usePostLanguage();
	const queryClient = useQueryClient();
	const router = useRouter();
	const { currentAccount } = useSession();

	const failedUploads = useFailedUploads();
	const blocker = useEditorState((state) => getPublishBlocker(state, failedUploads));
	const task = useStore(composer.publishing);

	const publish = async () => {
		const { replyUri, publishing, uploads, wg } = composer;
		if (publishing.get() !== null || getPublishBlocker(wg.state, uploads.getFailed()) !== null) {
			return;
		}

		const { appview, pds } = getClients();
		const posts = snapshotThread(wg.state, postLanguage);
		const controller = new AbortController();
		const { signal } = controller;
		publishing.set({ videos: getPlannedVideos(posts), cancel: () => controller.abort() });

		let uris;
		try {
			uris = await publishThread(
				{
					appview,
					pds: pds!,
					did: currentAccount!.did,
					queryClient,
					waitForVideo: (file) => uploads.wait(file, signal),
				},
				{ posts, replyUri, interaction, signal },
			);
		} catch (err) {
			publishing.set(null);
			if (signal.aborted) {
				return;
			}

			console.error('failed to publish thread', err);

			let message: string;
			if (err instanceof PublishError) {
				message = err.message;
			} else if (isNetworkError(err)) {
				message = m['lib.upload.postFailed']();
			} else {
				message = `Couldn't publish your post`;
			}
			Toast.show(message, { type: 'error' });
			return;
		}

		if (replyUri === null) {
			postCreated.emit();
		}
		savePublishedPostLanguages(posts.map((post) => post.langs));
		if (composer.draft) {
			deletePublishedDraft(queryClient, composer.draft).catch((err: unknown) => {
				console.error('failed to delete published draft', err);
			});
		}

		closeComposer();

		const [first] = uris;
		if (first && composer.onPostSuccess) {
			const { onPostSuccess } = composer;
			fetchPublishedThread(appview, first, uris.length).then(
				(thread) => onPostSuccess({ replyToUri: replyUri ?? undefined, posts: thread }),
				(err: unknown) => console.error('failed to fetch published thread', err),
			);
		}

		let message: string;
		if (uris.length > 1) {
			message = m['view.composer.publish.postsSent']();
		} else if (replyUri !== null) {
			message = m['view.composer.publish.replySent']();
		} else {
			message = m['view.composer.publish.postSent']();
		}

		// let the dialog finish closing first.
		setTimeout(() => {
			Toast.show(message, {
				type: 'success',
				action: first && {
					label: m['view.composer.publish.action.view'](),
					onPress() {
						router.navigate({ to: postUriToTarget(first) });
					},
				},
			});
		}, 500);
	};

	return { blocker, task, publish };
};
