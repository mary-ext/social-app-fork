import { useQueryClient } from '@tanstack/react-query';

import { isNetworkError } from '#/lib/errors';
import { postUriToTarget } from '#/lib/routes/targets';

import { postCreated } from '#/state/events';
import { savePostLanguageToHistory, usePostLanguage } from '#/state/preferences/languages';
import { getClients, useSession } from '#/state/session';

import { closeComposer } from '#/features/composer/open-composer';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import { type PublishTask, useComposer, useEditorState, useThreadInteraction } from '../context';
import { deletePublishedDraft } from '../drafts/queries';
import { useFailedUploads } from '../media/shared/upload-status';
import { useStore } from '../store';
import { getPublishBlocker, type PublishBlocker } from './blocker';
import { publishThread } from './publish-thread';
import { PublishError } from './resolve-post';
import { getPlannedVideos, snapshotThread } from './snapshot';

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
		savePostLanguageToHistory();
		if (composer.draft) {
			deletePublishedDraft(queryClient, composer.draft).catch((err: unknown) => {
				console.error('failed to delete published draft', err);
			});
		}

		closeComposer();

		const [first] = uris;
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
