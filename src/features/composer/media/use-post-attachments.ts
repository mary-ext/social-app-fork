import { type ComposerImage, createComposerImage } from '#/lib/media/composer-image';
import { getAttachmentKind, readAttachment } from '#/lib/media/read-attachment';

import { getClients, useSession } from '#/state/session';

import type { RestoredVideo } from '#/features/composer/drafts/state/api';
import { createAddImagesWithCap } from '#/features/composer/gallery-cap';
import type { ComposerAction, PostDraft } from '#/features/composer/state/composer';
import { processVideo, type VideoAttachment } from '#/features/composer/state/video';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { getAttachmentRejectionMessage, getSelectionErrorMessage } from './attachment-messages';
import { selectAttachments } from './select-attachments';

type PostAttachmentsOptions = {
	composerDispatch: (action: ComposerAction) => void;
	/** surfaces an error in the composer */
	onError: (error: string) => void;
};

/**
 * provides handlers that attach media to posts and drive video processing.
 *
 * @param options composer dispatcher and error handler
 * @returns handlers for adding files, attaching and removing videos, and restoring draft videos
 */
export const usePostAttachments = ({ composerDispatch, onError }: PostAttachmentsOptions) => {
	const { currentAccount } = useSession();
	const { pds, pdsUrl } = getClients();
	const currentDid = currentAccount!.did;

	// follow-up actions must carry the returned signal to pass the reducer's stale-action check.
	const selectVideo = (postId: string, attachment: VideoAttachment): AbortSignal => {
		const abortController = new AbortController();
		const signal = abortController.signal;
		composerDispatch({
			type: 'updatePost',
			postId,
			postAction: { type: 'embedAddVideo', attachment, abortController },
		});
		if (pds && pdsUrl) {
			void processVideo({
				attachment,
				did: currentDid,
				dispatch: (videoAction) => {
					composerDispatch({
						type: 'updatePost',
						postId,
						postAction: { type: 'embedUpdateVideo', videoAction },
					});
				},
				pds,
				pdsUrl,
				signal,
			});
		}
		return signal;
	};

	const clearVideo = (postId: string) => {
		composerDispatch({
			type: 'updatePost',
			postId,
			postAction: { type: 'embedRemoveVideo' },
		});
	};

	const addAttachments = async (post: PostDraft, blobs: Blob[]) => {
		const { selection, errors } = await selectAttachments(blobs, post.embed.media);

		for (const message of new Set(errors.map(getSelectionErrorMessage))) {
			Toast.show(message, { type: 'warning' });
		}

		switch (selection?.type) {
			case 'images': {
				const results = await Promise.allSettled(selection.blobs.map((blob) => createComposerImage(blob)));

				const images: ComposerImage[] = [];
				for (const [index, result] of results.entries()) {
					if (result.status === 'fulfilled') {
						images.push(result.value);
					} else {
						const blob = selection.blobs[index]!;
						console.error('createComposerImage failed', blob.type, blob.size, result.reason);
					}
				}

				if (images.length > 0) {
					const imageCount =
						post.embed.media?.type === 'images' || post.embed.media?.type === 'gallery'
							? post.embed.media.images.length
							: 0;
					createAddImagesWithCap(imageCount, (postAction) => {
						composerDispatch({ type: 'updatePost', postId: post.id, postAction });
					})(images);
				}

				const failed = selection.blobs.length - images.length;
				if (failed > 0) {
					onError(m['view.composer.gallery.error.notAdded']({ failed }));
				}
				break;
			}
			case 'video':
			case 'voice': {
				selectVideo(post.id, selection);
				break;
			}
		}
	};

	const restoreVideo = async (postId: string, videoInfo: RestoredVideo) => {
		try {
			// legacy drafts may have stored the file without a MIME type.
			const blob =
				videoInfo.blob.type === videoInfo.mimeType
					? videoInfo.blob
					: new Blob([videoInfo.blob], { type: videoInfo.mimeType });

			const result = await readAttachment(blob);
			if (!result.ok) {
				onError(getAttachmentRejectionMessage(result.rejection));
				return;
			}
			if (result.attachment.type !== 'video') {
				onError(
					getAttachmentRejectionMessage({
						reason: 'unsupported',
						kind: getAttachmentKind(result.attachment),
						mimeType: blob.type,
					}),
				);
				return;
			}
			const signal = selectVideo(postId, result.attachment);

			if (videoInfo.altText) {
				composerDispatch({
					type: 'updatePost',
					postId,
					postAction: {
						type: 'embedUpdateVideo',
						videoAction: { type: 'updateAltText', altText: videoInfo.altText, signal },
					},
				});
			}

			// Restore captions (web only - captions use File objects)
			if (videoInfo.captions.length > 0) {
				const captionTracks = videoInfo.captions.map((c) => ({
					lang: c.lang,
					file: new File([c.content], `caption-${c.lang}.vtt`, {
						type: 'text/vtt',
					}),
				}));
				composerDispatch({
					type: 'updatePost',
					postId,
					postAction: {
						type: 'embedUpdateVideo',
						videoAction: { type: 'updateCaptions', updater: () => captionTracks, signal },
					},
				});
			}
		} catch (e) {
			console.error('Failed to restore video from draft', postId, e);
		}
	};

	return {
		addAttachments: (post: PostDraft, blobs: Blob[]) => {
			void addAttachments(post, blobs);
		},
		clearVideo,
		restoreVideo: (postId: string, videoInfo: RestoredVideo) => {
			void restoreVideo(postId, videoInfo);
		},
		selectVideo,
	};
};
