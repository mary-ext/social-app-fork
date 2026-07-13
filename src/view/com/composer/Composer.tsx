import {
	Fragment,
	memo,
	useCallback,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';

import type { AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { isGraphemeLengthInRange } from '@atcute/util-text';

import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import * as apilib from '#/lib/api/index';
import { EmbeddingDisabledError } from '#/lib/api/resolve';
import { retry } from '#/lib/async/retry';
import { until } from '#/lib/async/until';
import {
	MAX_DRAFT_GRAPHEME_LENGTH,
	MAX_GRAPHEME_LENGTH,
	SUPPORTED_MIME_TYPES,
	type SupportedMimeTypes,
} from '#/lib/constants';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import {
	COMPOSER_DIALOG_ID,
	type ComposerOpts,
	type OnPostSuccessData,
	useComposerControls,
} from '#/lib/hooks/useOpenComposer';
import { getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import type { VideoAsset } from '#/lib/media/video/types';
import type { NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useDialogStateControlContext } from '#/state/dialogs';
import { postCreated } from '#/state/events';
import { type ComposerImage, createComposerImage } from '#/state/gallery';
import { toPostLanguages, useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences/languages';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { ComposerReplyTo } from '#/view/com/composer/ComposerReplyTo';
import { ExternalEmbedGif, ExternalEmbedLink } from '#/view/com/composer/ExternalEmbed';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import { GifAltText } from '#/view/com/composer/GifAltText';
import { Gallery } from '#/view/com/composer/photos/Gallery';
import { SuggestedLanguage } from '#/view/com/composer/select-language/SuggestedLanguage';
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import { TextInput } from '#/view/com/composer/text-input/TextInput';
import { SubtitleDialogBtn } from '#/view/com/composer/videos/SubtitleDialog';
import { VideoPreview } from '#/view/com/composer/videos/VideoPreview';

import * as Dialog from '#/components/Dialog';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { GalleryBleed } from '#/components/images/Gallery';
import { LazyQuoteEmbed } from '#/components/Post/Embed/LazyQuoteEmbed';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';

import * as styles from './Composer.css';
import * as ComposerError from './ComposerError';
import { ComposerFooter } from './ComposerFooter';
import { ComposerPills } from './ComposerPills';
import { ComposerTopBar } from './ComposerTopBar';
import { draftToComposerPosts, extractLocalRefs, type RestoredVideo } from './drafts/state/api';
import {
	loadDraftMedia,
	useCleanupPublishedDraftMutation,
	useSaveDraftMutation,
} from './drafts/state/queries';
import type { DraftSummary } from './drafts/state/schema';
import { useAddImagesWithCap } from './gallery-cap';
import {
	type ComposerAction,
	composerReducer,
	createComposerState,
	type EmbedDraft,
	type PostAction,
	type PostDraft,
	type ThreadDraft,
} from './state/composer';
import { NO_VIDEO, type NoVideoState, processVideo, type VideoState } from './state/video';
import type { TextInputRef } from './text-input/TextInput.types';

/** Minimum gap between honored language-detection nudges, so rapid detector firings don't re-pulse the button. */
const NUDGE_COOLDOWN_MS = 10_000;

type Props = ComposerOpts;
export const ComposePost = ({
	replyTo,
	onPost,
	onPostSuccess,
	quote: initQuote,
	mention: initMention,
	text: initText,
	videoUri: initVideoUri,
	openGallery,
	cancelRef,
}: Props & {
	cancelRef?: React.RefObject<CancelRef | null>;
}) => {
	const { currentAccount } = useSession();
	const { appview, pds, pdsUrl } = useClients();
	const queryClient = useQueryClient();
	const currentDid = currentAccount!.did;
	const { closeComposer } = useComposerControls();
	const [requireAltTextEnabled] = useRequireAltTextEnabled();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();
	const textInputRef = useRef<TextInputRef>(null);
	const discardPromptHandle = Prompt.usePromptHandle();
	const emptyPostsPromptHandle = Prompt.usePromptHandle();
	const skipEmptyConfirmedRef = useRef(false);
	const { mutateAsync: saveDraft, isPending: _isSavingDraft } = useSaveDraftMutation();
	const { mutate: cleanupPublishedDraft } = useCleanupPublishedDraftMutation();
	const { closeAllDialogs } = useDialogStateControlContext();
	const { data: preferences } = usePreferencesQuery();
	const navigation = useNavigation<NavigationProp>();

	const [isPublishing, setIsPublishing] = useState(false);
	const [publishingStage, setPublishingStage] = useState('');
	const [error, setError] = useState('');

	/**
	 * A temporary local reference to a language suggestion that the user has accepted. This overrides the
	 * global post language preference, but is not stored permanently.
	 */
	const [acceptedLanguageSuggestion, setAcceptedLanguageSuggestion] = useState<string | null>(null);

	/** The language(s) of the post being replied to. */
	const [replyToLanguages, setReplyToLanguages] = useState<string[]>(replyTo?.langs || []);

	/**
	 * The currently selected languages of the post. Prefer local temporary language suggestion over global lang
	 * prefs, if available.
	 */
	const currentLanguages = useMemo(
		() =>
			acceptedLanguageSuggestion ? [acceptedLanguageSuggestion] : toPostLanguages(langPrefs.postLanguage),
		[acceptedLanguageSuggestion, langPrefs.postLanguage],
	);

	/**
	 * clear temporary and suggested languages when the user selects a language from the composer language
	 * selector
	 */
	const onSelectLanguage = () => {
		setAcceptedLanguageSuggestion(null);
		setReplyToLanguages([]);
	};

	/** timestamp (ms) of the last honored nudge from language detection, used to rate-limit the pulse animation. */
	const [languageNudgeAt, setLanguageNudgeAt] = useState(0);
	const onLanguageNudge = () => {
		const now = Date.now();
		// only update state (and therefore re-pulse) once the cooldown has elapsed
		setLanguageNudgeAt((prev) => (now - prev > NUDGE_COOLDOWN_MS ? now : prev));
	};

	const [composerState, composerDispatch] = useReducer(
		composerReducer,
		{
			initQuoteUri: initQuote?.uri,
			initText,
			initMention,
			initInteractionSettings: preferences?.postInteractionSettings,
		},
		createComposerState,
	);

	const thread = composerState.thread;

	// Clear error when composer content changes, but only if all posts are
	// back within the character limit.
	const allPostsWithinLimit = thread.posts.every((post) =>
		isGraphemeLengthInRange(post.text, 0, MAX_DRAFT_GRAPHEME_LENGTH),
	);

	const activePost = thread.posts[composerState.activePostIndex]!;
	const nextPost: PostDraft | undefined = thread.posts[composerState.activePostIndex + 1];
	const dispatch = useCallback(
		(postAction: PostAction) => {
			composerDispatch({
				type: 'update_post',
				postId: activePost.id,
				postAction,
			});
		},
		[activePost.id],
	);

	const selectVideo = useCallback(
		(postId: string, asset: VideoAsset) => {
			const abortController = new AbortController();
			composerDispatch({
				type: 'update_post',
				postId: postId,
				postAction: {
					type: 'embed_add_video',
					asset,
					abortController,
				},
			});
			if (!pds || !pdsUrl) return;
			void processVideo(
				asset,
				(videoAction) => {
					composerDispatch({
						type: 'update_post',
						postId: postId,
						postAction: {
							type: 'embed_update_video',
							videoAction,
						},
					});
				},
				pdsUrl,
				pds,
				currentDid,
				abortController.signal,
			);
		},
		[pds, pdsUrl, currentDid, composerDispatch],
	);

	const onInitVideo = useEffectEvent(() => {
		if (initVideoUri) {
			selectVideo(activePost.id, initVideoUri);
		}
	});

	useEffect(() => {
		onInitVideo();
	}, []);

	const clearVideo = useCallback(
		(postId: string) => {
			composerDispatch({
				type: 'update_post',
				postId: postId,
				postAction: {
					type: 'embed_remove_video',
				},
			});
		},
		[composerDispatch],
	);

	const restoreVideo = useCallback(
		async (postId: string, videoInfo: RestoredVideo) => {
			try {
				logger.debug('restoring video from draft', {
					postId,
					altText: videoInfo.altText,
					captionCount: videoInfo.captions.length,
				});

				const meta = await getVideoMetadata(videoInfo.blob);
				const asset: VideoAsset = {
					blob: videoInfo.blob,
					width: meta.width,
					height: meta.height,
					mimeType: videoInfo.mimeType,
					duration: meta.duration,
				};

				// Start video processing using existing flow
				const abortController = new AbortController();
				composerDispatch({
					type: 'update_post',
					postId,
					postAction: {
						type: 'embed_add_video',
						asset,
						abortController,
					},
				});

				// Restore alt text immediately
				if (videoInfo.altText) {
					composerDispatch({
						type: 'update_post',
						postId,
						postAction: {
							type: 'embed_update_video',
							videoAction: {
								type: 'update_alt_text',
								altText: videoInfo.altText,
								signal: abortController.signal,
							},
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
						type: 'update_post',
						postId,
						postAction: {
							type: 'embed_update_video',
							videoAction: {
								type: 'update_captions',
								updater: () => captionTracks,
								signal: abortController.signal,
							},
						},
					});
				}

				// Start video compression and upload
				if (!pds || !pdsUrl) return;
				void processVideo(
					asset,
					(videoAction) => {
						composerDispatch({
							type: 'update_post',
							postId,
							postAction: {
								type: 'embed_update_video',
								videoAction,
							},
						});
					},
					pdsUrl,
					pds,
					currentDid,
					abortController.signal,
				);
			} catch (e) {
				logger.error('Failed to restore video from draft', {
					postId,
					error: e,
				});
			}
		},
		[pds, pdsUrl, currentDid, composerDispatch],
	);

	const handleSelectDraft = useCallback(
		async (draftSummary: DraftSummary) => {
			logger.debug('loading draft for editing', {
				draftId: draftSummary.id,
			});

			// Load local media files for the draft
			const { loadedMedia } = await loadDraftMedia(draftSummary.draft);

			// Extract original localRefs for orphan detection on save
			const originalLocalRefs = extractLocalRefs(draftSummary.draft);

			logger.debug('draft loaded', {
				draftId: draftSummary.id,
				loadedMediaCount: loadedMedia.size,
				originalLocalRefCount: originalLocalRefs.size,
			});

			// Convert server draft to composer posts (videos returned separately)
			const { posts, restoredVideos } = await draftToComposerPosts(draftSummary.draft, loadedMedia);

			// Dispatch restore action (this also sets draftId in state)
			composerDispatch({
				type: 'restore_from_draft',
				draftId: draftSummary.id,
				posts,
				threadgateAllow: draftSummary.draft.threadgateAllow,
				postgateEmbeddingRules: draftSummary.draft.postgateEmbeddingRules,
				loadedMedia,
				originalLocalRefs,
			});

			// Initiate video processing for any restored videos
			// This is async but we don't await - videos process in the background
			for (const [postIndex, videoInfo] of restoredVideos) {
				const postId = posts[postIndex]!.id;
				void restoreVideo(postId, videoInfo);
			}
		},
		[composerDispatch, restoreVideo],
	);

	const [publishOnUpload, setPublishOnUpload] = useState(false);
	// monotonic token bumped (during render) when a publish queued on upload completion is ready to fire.
	// consumed once by the effect below via a handled-ref, so the publish side effect runs after commit
	// without any setState landing in the effect body.
	const [uploadCompletionPublishRequest, setUploadCompletionPublishRequest] = useState(0);
	const handledUploadCompletionPublishRequestRef = useRef(0);

	const onClose = useCallback(() => {
		closeComposer();
	}, [closeComposer]);

	const getDraftSaveError = useCallback((e: unknown): string => {
		if (e instanceof ClientResponseError && e.error === 'DraftLimitReached') {
			return m['view.composer.drafts.error.max']();
		}
		return m['view.composer.drafts.error.save']();
	}, []);

	const validateDraftTextOrError = useCallback((): boolean => {
		const tooLong = composerState.thread.posts.some(
			(post) => !isGraphemeLengthInRange(post.text, 0, MAX_DRAFT_GRAPHEME_LENGTH),
		);
		if (tooLong) {
			setError(m['view.composer.drafts.error.tooLong']({ max: MAX_DRAFT_GRAPHEME_LENGTH }));
			return false;
		}
		return true;
	}, [composerState.thread.posts]);

	const handleSaveDraft = useCallback(async () => {
		setError('');
		if (!validateDraftTextOrError()) {
			return;
		}
		try {
			const result = await saveDraft({
				composerState,
				existingDraftId: composerState.draftId,
			});
			composerDispatch({ type: 'mark_saved', draftId: result.draftId });

			onClose();
		} catch (e) {
			logger.error('Failed to save draft', { error: e });
			setError(getDraftSaveError(e));
		}
	}, [saveDraft, composerState, composerDispatch, onClose, validateDraftTextOrError, getDraftSaveError]);

	// Save without closing - for use by DraftsButton
	const saveCurrentDraft = useCallback(async (): Promise<{
		success: boolean;
	}> => {
		setError('');
		if (!validateDraftTextOrError()) {
			return { success: false };
		}
		try {
			const result = await saveDraft({
				composerState,
				existingDraftId: composerState.draftId,
			});
			composerDispatch({ type: 'mark_saved', draftId: result.draftId });
			return { success: true };
		} catch (e) {
			setError(getDraftSaveError(e));
			return { success: false };
		}
	}, [saveDraft, composerState, composerDispatch, validateDraftTextOrError, getDraftSaveError]);

	// Handle discard action and close the composer.
	const handleDiscard = useCallback(() => {
		onClose();
	}, [onClose]);

	// Check if composer is empty (no content to save)
	const isComposerEmpty = useMemo(() => {
		// Has multiple posts means it's not empty
		if (thread.posts.length > 1) return false;

		const firstPost = thread.posts[0]!;
		// Has text
		if (firstPost.text.trim().length > 0) return false;
		// Has media
		if (firstPost.embed.media) return false;
		// Has quote
		if (firstPost.embed.quote) return false;
		// Has link
		if (firstPost.embed.link) return false;

		return true;
	}, [thread.posts]);

	// Clear the composer (discard current content)
	const handleClearComposer = useCallback(() => {
		composerDispatch({
			type: 'clear',
			initInteractionSettings: preferences?.postInteractionSettings,
		});
	}, [composerDispatch, preferences?.postInteractionSettings]);

	/**
	 * decides how to handle a cancel request (Cancel button, Escape, backdrop press).
	 *
	 * @returns true if the composer should stay open (e.g., a sub-popup was closed or discard prompt shown), or
	 *   false if the caller should close the composer.
	 */
	const onPressCancel = useCallback((): boolean => {
		if (textInputRef.current?.maybeClosePopup()) {
			return true;
		}

		const hasContent = thread.posts.some(
			(post) => post.shortenedGraphemeLength > 0 || post.embed.media || post.embed.link,
		);

		// Show discard prompt if there's content AND either:
		// - No draft is loaded (new composition)
		// - Draft is loaded but has been modified
		if (hasContent && (!composerState.draftId || composerState.isDirty)) {
			// Dismiss sub-dialogs (emoji picker, etc.) but keep the composer itself open so the discard
			// prompt has something to confirm against.
			closeAllDialogs({ except: [COMPOSER_DIALOG_ID] });
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
			discardPromptHandle.open(null);
			return true;
		}
		return false;
	}, [thread, composerState.draftId, composerState.isDirty, closeAllDialogs, discardPromptHandle]);

	useImperativeHandle(cancelRef, () => ({ onPressCancel }));

	// The Cancel button drives the close itself (the dialog's `onOpenChange` does it for Escape/backdrop).
	const onRequestClose = useCallback(() => {
		if (!onPressCancel()) {
			onClose();
		}
	}, [onPressCancel, onClose]);

	const missingAltError = ((): string | undefined => {
		if (!requireAltTextEnabled) {
			return;
		}
		for (let i = 0; i < thread.posts.length; i++) {
			const media = thread.posts[i]!.embed.media;
			if (media) {
				if ((media.type === 'images' || media.type === 'gallery') && media.images.some((img) => !img.alt)) {
					return m['view.composer.gallery.error.altMissing']();
				}
				if (media.type === 'gif' && !media.alt) {
					return m['view.composer.gif.error.altMissing']();
				}
				if (media.type === 'video' && media.video.status !== 'error' && !media.video.altText) {
					return m['view.composer.video.error.altMissing']();
				}
			}
		}
	})();

	const canPost =
		!missingAltError &&
		thread.posts.some((post) => !isEmptyPost(post)) &&
		thread.posts.every(
			(post) =>
				isEmptyPost(post) ||
				(post.shortenedGraphemeLength <= MAX_GRAPHEME_LENGTH &&
					!(post.embed.media?.type === 'video' && post.embed.media.video.status === 'error')),
		);

	const getFilteredThread = useCallback((): {
		type: 'none' | 'trailing-only' | 'non-trailing';
		filteredThread: ThreadDraft;
	} => {
		const nonEmptyPosts = thread.posts.filter((post) => !isEmptyPost(post));

		if (nonEmptyPosts.length === thread.posts.length) {
			return { type: 'none', filteredThread: thread };
		}

		let lastNonEmptyIndex = -1;
		for (let i = thread.posts.length - 1; i >= 0; i--) {
			if (!isEmptyPost(thread.posts[i]!)) {
				lastNonEmptyIndex = i;
				break;
			}
		}

		const hasNonTrailingEmpty = thread.posts.some((post, i) => i < lastNonEmptyIndex && isEmptyPost(post));

		const filteredThread: ThreadDraft = { ...thread, posts: nonEmptyPosts };

		return {
			type: hasNonTrailingEmpty ? 'non-trailing' : 'trailing-only',
			filteredThread,
		};
	}, [thread]);

	const onPressPublish = useCallback(async () => {
		if (isPublishing) {
			return;
		}

		if (!canPost) {
			return;
		}

		const { type: emptyType, filteredThread } = getFilteredThread();

		if (emptyType === 'non-trailing' && !skipEmptyConfirmedRef.current) {
			emptyPostsPromptHandle.open(null);
			return;
		}

		if (
			filteredThread.posts.some(
				(post) =>
					post.embed.media?.type === 'video' &&
					post.embed.media.video.asset &&
					post.embed.media.video.status !== 'done',
			)
		) {
			setPublishOnUpload(true);
			return;
		}

		skipEmptyConfirmedRef.current = false;
		setError('');
		setIsPublishing(true);

		let postUri: string | undefined;
		let postSuccessData: OnPostSuccessData;
		try {
			logger.info(`composer: posting...`);
			postUri = (
				await apilib.post({ appview, did: currentDid as Did, pds: pds! }, queryClient, {
					thread: filteredThread,
					replyTo: replyTo?.uri,
					onStateChange: setPublishingStage,
					langs: currentLanguages,
				})
			).uris[0];

			/*
			 * Wait for app view to have received the post(s). If this fails, it's
			 * ok, because the post _was_ actually published above.
			 */
			try {
				if (postUri) {
					logger.info(`composer: waiting for app view`);

					const posts = await retry(
						5,
						(_e) => true,
						async () => {
							const data = await ok(
								appview.get('app.bsky.unspecced.getPostThreadV2', {
									params: {
										anchor: postUri! as ResourceUri,
										above: false,
										below: filteredThread.posts.length - 1,
										branchingFactor: 1,
									},
								}),
							);
							if (data.thread.length !== filteredThread.posts.length) {
								throw new Error(`composer: app view is not ready`);
							}
							if (!data.thread.every((p) => p.value.$type === 'app.bsky.unspecced.defs#threadItemPost')) {
								throw new Error(`composer: app view returned non-post items`);
							}
							return data.thread;
						},
						1e3,
					);
					postSuccessData = {
						replyToUri: replyTo?.uri,
						posts,
					};
				}
			} catch (waitErr: unknown) {
				logger.info(`composer: waiting for app view failed`, {
					safeMessage: waitErr,
				});
			}
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			logger.error(error, {
				message: `Composer: create post failed`,
				hasImages: filteredThread.posts.some(
					(p) => p.embed.media?.type === 'images' || p.embed.media?.type === 'gallery',
				),
			});

			let err = cleanError(error.message);
			if (e instanceof apilib.ReplyDeletedError || err.includes('not locate record')) {
				err = m['view.composer.reply.deleted']();
			} else if (e instanceof EmbeddingDisabledError) {
				err = m['view.composer.quote.disabled']();
			}
			setError(err);
			setIsPublishing(false);
			return;
		}
		if (postUri && !replyTo) {
			postCreated.emit();
		}
		// Clean up draft and its media after successful publish
		if (composerState.draftId && composerState.originalLocalRefs) {
			logger.debug('post published, cleaning up draft', {
				draftId: composerState.draftId,
				mediaFileCount: composerState.originalLocalRefs.size,
			});
			cleanupPublishedDraft({
				draftId: composerState.draftId,
				originalLocalRefs: composerState.originalLocalRefs,
			});
		}
		setLangPrefs.savePostLanguageToHistory();
		if (initQuote) {
			// We want to wait for the quote count to update before we call `onPost`, which will refetch data
			void whenAppViewReady(appview, initQuote.uri, (res) => {
				const anchor = res.thread.at(0);
				if (
					anchor?.value.$type === 'app.bsky.unspecced.defs#threadItemPost' &&
					anchor.value.post.quoteCount !== initQuote.quoteCount
				) {
					onPost?.(postUri);
					// false positive: `postUri`/`postSuccessData` are locals captured by this async closure, misread as deps.
					// oxlint-disable-next-line react/react-compiler
					onPostSuccess?.(postSuccessData);
					return true;
				}
				return false;
			});
		} else {
			onPost?.(postUri);
			onPostSuccess?.(postSuccessData);
		}
		onClose();
		setTimeout(() => {
			Toast.show(
				filteredThread.posts.length > 1
					? m['view.composer.publish.postsSent']()
					: replyTo
						? m['view.composer.publish.replySent']()
						: m['view.composer.publish.postSent'](),
				{
					action: postUri
						? {
								label: m['view.composer.publish.action.view'](),
								onPress: () => {
									const { repo: name, rkey } = parseCanonicalResourceUri(postUri);
									navigation.navigate('PostThread', { name, rkey });
								},
							}
						: undefined,
					type: 'success',
				},
			);
		}, 500);
	}, [
		appview,
		canPost,
		cleanupPublishedDraft,
		composerState.draftId,
		composerState.originalLocalRefs,
		currentDid,
		currentLanguages,
		emptyPostsPromptHandle,
		getFilteredThread,
		initQuote,
		isPublishing,
		navigation,
		onClose,
		onPost,
		onPostSuccess,
		pds,
		queryClient,
		replyTo,
		setLangPrefs,
	]);

	const handleConfirmSkipEmpty = () => {
		skipEmptyConfirmedRef.current = true;
		void onPressPublish();
	};

	// Preserves the referential identity passed to each post item.
	// Avoids re-rendering all posts on each keystroke.
	const onComposerPostPublish = useNonReactiveCallback(() => {
		void onPressPublish();
	});

	// `publishOnUpload` latches when a publish is queued waiting for video uploads to finish. the upload
	// status is derived during render, and the latch clears via a render-time adjustment the moment uploads
	// reach a terminal state — so neither setState lands in an effect. on a clean completion the publish is
	// armed by bumping a monotonic token; the effect below fires it once after commit.
	const queuedVideoUploadStatus = useMemo((): 'blocked' | 'complete' | 'uploading' => {
		let hasUploadingVideo = false;
		for (const post of thread.posts) {
			if (isEmptyPost(post)) continue;
			if (post.embed.media?.type !== 'video') continue;
			switch (post.embed.media.video.status) {
				case 'done': {
					break;
				}
				case 'error': {
					return 'blocked';
				}
				default: {
					hasUploadingVideo = true;
					break;
				}
			}
		}
		return hasUploadingVideo ? 'uploading' : 'complete';
	}, [thread.posts]);

	if (publishOnUpload) {
		switch (queuedVideoUploadStatus) {
			case 'blocked': {
				setPublishOnUpload(false);
				break;
			}
			case 'complete': {
				setPublishOnUpload(false);
				setUploadCompletionPublishRequest((request) => request + 1);
				break;
			}
			case 'uploading': {
				break;
			}
		}
	}

	// fire the armed publish after commit. the handled-ref makes it idempotent against effect replay or
	// callback identity churn, so `onComposerPostPublish` (a useNonReactiveCallback) won't re-trigger.
	useEffect(() => {
		if (
			uploadCompletionPublishRequest === 0 ||
			handledUploadCompletionPublishRequestRef.current === uploadCompletionPublishRequest
		) {
			return;
		}
		handledUploadCompletionPublishRequestRef.current = uploadCompletionPublishRequest;
		onComposerPostPublish();
	}, [uploadCompletionPublishRequest, onComposerPostPublish]);

	// TODO: It might make more sense to display this error per-post.
	// Right now we're just displaying the first one.
	let erroredVideoPostId: string | undefined;
	let erroredVideo: VideoState | NoVideoState = NO_VIDEO;
	for (let i = 0; i < thread.posts.length; i++) {
		const post = thread.posts[i]!;
		if (post.embed.media?.type === 'video' && post.embed.media.video.status === 'error') {
			erroredVideoPostId = post.id;
			erroredVideo = post.embed.media.video;
			break;
		}
	}

	// The single error to surface: an explicit error string wins over a video-upload error.
	const displayedError: { error: string; detail?: string; onDismiss: () => void } | undefined = error
		? { error, onDismiss: () => setError('') }
		: erroredVideo.status === 'error'
			? {
					error: erroredVideo.error,
					detail: erroredVideo.jobId
						? m['view.composer.video.jobId']({ jobId: erroredVideo.jobId })
						: undefined,
					onDismiss: () => {
						if (erroredVideoPostId) {
							clearVideo(erroredVideoPostId);
						}
					},
				}
			: undefined;

	const scrollViewRef = useRef<HTMLDivElement | null>(null);
	// focus the text input once per focus request. the reducer bumps `activePostFocusRequestId` on
	// focus-requesting actions; this effect consumes each committed request exactly once by tracking
	// the last-handled id in a ref, so no reducer state is mutated after render.
	const handledFocusRequestIdRef = useRef(0);
	useEffect(() => {
		if (composerState.activePostFocusRequestId === handledFocusRequestIdRef.current) {
			return;
		}
		handledFocusRequestIdRef.current = composerState.activePostFocusRequestId;
		textInputRef.current?.focus();
	}, [composerState.activePostFocusRequestId]);

	const isLastThreadedPost = thread.posts.length > 1 && nextPost === undefined;
	const { scrollHandler, isScrolled } = useScrollTracker({
		scrollViewRef,
		stickyBottom: isLastThreadedPost,
	});

	const footer = (
		<>
			<SuggestedLanguage
				text={activePost.text}
				replyToLanguages={replyToLanguages}
				currentLanguages={currentLanguages}
				onAcceptSuggestedLanguage={setAcceptedLanguageSuggestion}
				onNudge={onLanguageNudge}
			/>
			<ComposerPills
				isReply={!!replyTo}
				post={activePost}
				thread={composerState.thread}
				dispatch={composerDispatch}
			/>
			<ComposerFooter
				post={activePost}
				dispatch={dispatch}
				showAddButton={!isEmptyPost(activePost) && (!nextPost || !isEmptyPost(nextPost))}
				onError={setError}
				onSelectVideo={selectVideo}
				onAddPost={() => {
					composerDispatch({
						type: 'add_post',
					});
				}}
				currentLanguages={currentLanguages}
				onSelectLanguage={onSelectLanguage}
				languageNudgeAt={languageNudgeAt}
				openGallery={openGallery}
				textInputRef={textInputRef}
			/>
		</>
	);

	const IS_WEBFooterSticky = thread.posts.length > 1;
	return (
		<>
			<ComposerTopBar
				border={isScrolled}
				canPost={canPost}
				isReply={!!replyTo}
				isPublishQueued={publishOnUpload}
				isPublishing={isPublishing}
				isThread={thread.posts.length > 1}
				publishingStage={publishingStage}
				onCancel={onRequestClose}
				onPublish={() => void onPressPublish()}
				onSelectDraft={(draftSummary) => void handleSelectDraft(draftSummary)}
				onSaveDraft={saveCurrentDraft}
				onDiscard={handleClearComposer}
				isEmpty={isComposerEmpty}
				isDirty={composerState.isDirty}
				isEditingDraft={!!composerState.draftId}
				canSaveDraft={allPostsWithinLimit}
				textLength={thread.posts[0]!.text.length}
			/>
			{/* The composer owns its own scrolling (the `Dialog.Body` / `scrollContainer` below) */}
			<Dialog.Body className={styles.dialogBody}>
				<ComposerError.Root>
					{missingAltError && <ComposerError.Box error={missingAltError} />}
					{displayedError && (
						<ComposerError.Box
							error={displayedError.error}
							detail={displayedError.detail}
							onDismiss={displayedError.onDismiss}
						/>
					)}
				</ComposerError.Root>
				<div ref={scrollViewRef} onScroll={scrollHandler} className={styles.scrollContainer}>
					{replyTo ? <ComposerReplyTo replyTo={replyTo} /> : undefined}
					{thread.posts.map((post, index) => (
						<Fragment key={post.id + (composerState.draftId ?? '')}>
							<ComposerPost
								post={post}
								dispatch={composerDispatch}
								textInputRef={post.id === activePost.id ? textInputRef : null}
								isFirstPost={index === 0}
								isLastPost={index === thread.posts.length - 1}
								isPartOfThread={thread.posts.length > 1}
								isReply={index > 0 || !!replyTo}
								isActive={post.id === activePost.id}
								canRemovePost={thread.posts.length > 1}
								canRemoveQuote={index > 0 || !initQuote}
								onSelectVideo={selectVideo}
								onClearVideo={clearVideo}
								onPublish={onComposerPostPublish}
								onError={setError}
							/>
							{IS_WEBFooterSticky && post.id === activePost.id && (
								<div className={styles.stickyFooterWeb}>{footer}</div>
							)}
						</Fragment>
					))}
				</div>
			</Dialog.Body>
			{!IS_WEBFooterSticky && footer}

			{replyTo ? (
				<Prompt.Basic
					handle={discardPromptHandle}
					title={m['view.composer.drafts.discard.title']()}
					confirmButtonCta={m['common.action.discard']()}
					confirmButtonColor="negative"
					onConfirm={handleDiscard}
				/>
			) : (
				<Prompt.Outer handle={discardPromptHandle}>
					<Prompt.Content>
						<Prompt.TitleText>
							{allPostsWithinLimit
								? composerState.draftId
									? m['view.composer.drafts.saveChanges.title']()
									: m['view.composer.drafts.save.title']()
								: m['view.composer.discard.title']()}
						</Prompt.TitleText>
						<Prompt.DescriptionText>
							{allPostsWithinLimit
								? composerState.draftId
									? m['view.composer.drafts.saveChanges.message']()
									: m['view.composer.drafts.save.message']()
								: m['view.composer.drafts.error.tooLongFixed']({ max: MAX_DRAFT_GRAPHEME_LENGTH })}
						</Prompt.DescriptionText>
					</Prompt.Content>
					<Prompt.Actions>
						{allPostsWithinLimit && (
							<Prompt.Action
								cta={
									composerState.draftId
										? m['common.action.saveChanges']()
										: m['view.composer.drafts.action.save']()
								}
								onPress={() => void handleSaveDraft()}
								color="primary"
							/>
						)}
						<Prompt.Action
							cta={m['common.action.discard']()}
							onPress={handleDiscard}
							color="negative_subtle"
						/>
						<Prompt.Cancel cta={m['view.composer.discard.keepEditing']()} />
					</Prompt.Actions>
				</Prompt.Outer>
			)}

			<Prompt.Basic
				handle={emptyPostsPromptHandle}
				title={m['view.composer.thread.skipEmpty.title']()}
				description={m['view.composer.thread.skipEmpty.message']()}
				confirmButtonCta={m['view.composer.publish.action.anyway']()}
				cancelButtonCta={m['view.composer.discard.keepEditing']()}
				onConfirm={handleConfirmSkipEmpty}
			/>
		</>
	);
};

const ComposerPost = memo(function ComposerPost({
	post,
	dispatch,
	textInputRef,
	isActive,
	isReply,
	isFirstPost,
	isLastPost,
	isPartOfThread,
	canRemovePost,
	canRemoveQuote,
	onClearVideo,
	onSelectVideo,
	onError,
	onPublish,
}: {
	post: PostDraft;
	dispatch: (action: ComposerAction) => void;
	textInputRef: React.RefObject<TextInputRef | null> | null;
	isActive: boolean;
	isReply: boolean;
	isFirstPost: boolean;
	isLastPost: boolean;
	isPartOfThread: boolean;
	canRemovePost: boolean;
	canRemoveQuote: boolean;
	onClearVideo: (postId: string) => void;
	onSelectVideo: (postId: string, asset: VideoAsset) => void;
	onError: (error: string) => void;
	onPublish: (text: string) => void;
}) {
	const { currentAccount } = useSession();
	const currentDid = currentAccount!.did;
	const { data: currentProfile } = useProfileQuery({ did: currentDid });
	const text = post.text;
	const isTextOnly = !post.embed.link && !post.embed.quote && !post.embed.media;
	const forceMinHeight = isTextOnly && isActive;
	const selectTextInputPlaceholder = isReply
		? isFirstPost
			? m['common.compose.replyPlaceholder']()
			: m['view.composer.thread.action.addPost']()
		: m['common.compose.placeholder']();
	const discardPromptHandle = Prompt.usePromptHandle();

	const dispatchPost = useCallback(
		(action: PostAction) => {
			dispatch({
				type: 'update_post',
				postId: post.id,
				postAction: action,
			});
		},
		[dispatch, post.id],
	);

	const postImagesCount =
		post.embed.media?.type === 'images' || post.embed.media?.type === 'gallery'
			? post.embed.media.images.length
			: 0;
	const onImageAdd = useAddImagesWithCap(postImagesCount, dispatchPost);

	const onNewLink = useCallback(
		(uri: string) => {
			dispatchPost({ type: 'embed_add_uri', uri });
		},
		[dispatchPost],
	);

	const onPhotoPasted = useCallback(
		async (blob: Blob) => {
			const mimeType = blob.type;
			if (mimeType.startsWith('video/') || mimeType === 'image/gif') {
				if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeTypes)) {
					Toast.show(m['view.composer.video.error.unsupportedType']({ mimeType }), {
						type: 'error',
					});
					return;
				}
				if (mimeType === 'image/gif') {
					const { width, height } = await getImageDimensions(blob);
					onSelectVideo(post.id, { blob, width, height, mimeType, duration: null });
				} else {
					const { width, height, duration } = await getVideoMetadata(blob);
					onSelectVideo(post.id, { blob, width, height, mimeType, duration });
				}
			} else {
				let image: ComposerImage;
				try {
					image = await createComposerImage(blob);
				} catch (e) {
					logger.error(`createComposerImage failed`, {
						safeMessage: e instanceof Error ? e.message : String(e),
						mimeType: blob.type,
						size: blob.size,
					});
					onError(m['view.composer.gallery.error.paste']());
					return;
				}
				onImageAdd([image]);
			}
		},
		[post.id, onSelectVideo, onImageAdd, onError],
	);

	return (
		<GalleryBleed>
			<div className={clsx(styles.postContainer, !isActive && styles.inactivePost)}>
				<UserAvatar
					avatar={currentProfile?.avatar}
					size={36}
					type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
				/>

				<div className={styles.col}>
					<TextInput
						ref={textInputRef}
						text={text}
						placeholder={selectTextInputPlaceholder}
						autoFocus={isLastPost}
						forceMinHeight={forceMinHeight}
						// To avoid overlap with the close button:
						hasRightPadding={isPartOfThread}
						isActive={isActive}
						setText={(text) => {
							dispatchPost({ type: 'update_text', text });
						}}
						onFocus={() => {
							dispatch({
								type: 'focus_post',
								postId: post.id,
							});
						}}
						onPhotoPasted={(blob) => void onPhotoPasted(blob)}
						onNewLink={onNewLink}
						onError={onError}
						onPressPublish={onPublish}
						accessible={true}
						accessibilityLabel={m['common.compose.action.write']()}
						accessibilityHint={m['view.composer.text.maxLengthHint']({ count: MAX_GRAPHEME_LENGTH || 0 })}
					/>

					{canRemovePost && isActive && (
						<>
							<Button
								label={m['common.post.delete']()}
								size="small"
								color="secondary"
								variant="ghost"
								shape="round"
								className={styles.remove}
								onClick={() => {
									if (
										post.shortenedGraphemeLength > 0 ||
										post.embed.media ||
										post.embed.link ||
										post.embed.quote
									) {
										discardPromptHandle.open(null);
									} else {
										dispatch({
											type: 'remove_post',
											postId: post.id,
										});
									}
								}}
							>
								<ButtonIcon icon={XIcon} />
							</Button>

							<Prompt.Basic
								handle={discardPromptHandle}
								title={m['view.composer.discard.title']()}
								description={m['view.composer.discard.message']()}
								onConfirm={() => {
									dispatch({
										type: 'remove_post',
										postId: post.id,
									});
								}}
								confirmButtonCta={m['common.action.discard']()}
								confirmButtonColor="negative"
							/>
						</>
					)}

					<ComposerEmbeds
						canRemoveQuote={canRemoveQuote}
						embed={post.embed}
						dispatch={dispatchPost}
						clearVideo={() => onClearVideo(post.id)}
						isActivePost={isActive}
					/>
				</div>
			</div>
		</GalleryBleed>
	);
});

function ComposerEmbeds({
	embed,
	dispatch,
	clearVideo,
	canRemoveQuote,
	isActivePost,
}: {
	embed: EmbedDraft;
	dispatch: (action: PostAction) => void;
	clearVideo: () => void;
	canRemoveQuote: boolean;
	isActivePost: boolean;
}) {
	const video = embed.media?.type === 'video' ? embed.media.video : null;
	return (
		<>
			{(embed.media?.type === 'images' || embed.media?.type === 'gallery') && (
				<Gallery images={embed.media.images} dispatch={dispatch} />
			)}
			{embed.media?.type === 'gif' && (
				<div className={styles.gifContainer} key={embed.media.gif.url}>
					<ExternalEmbedGif gif={embed.media.gif} onRemove={() => dispatch({ type: 'embed_remove_gif' })} />
					<GifAltText
						gif={embed.media.gif}
						altText={embed.media.alt ?? ''}
						onSubmit={(altText: string) => {
							dispatch({ type: 'embed_update_gif', alt: altText });
						}}
					/>
				</div>
			)}
			{!embed.media && embed.link && (
				<div className={styles.linkContainer} key={embed.link.uri}>
					<ExternalEmbedLink
						uri={embed.link.uri}
						hasQuote={!!embed.quote}
						onRemove={() => dispatch({ type: 'embed_remove_link' })}
					/>
				</div>
			)}
			{video && (
				<div className={styles.videoContainer}>
					{video.asset &&
						(video.status !== 'compressing' && video.video ? (
							<VideoPreview
								asset={video.asset}
								video={video.video}
								isActivePost={isActivePost}
								clear={clearVideo}
							/>
						) : null)}
					<SubtitleDialogBtn
						defaultAltText={video.altText}
						saveAltText={(altText) =>
							dispatch({
								type: 'embed_update_video',
								videoAction: {
									type: 'update_alt_text',
									altText,
									signal: video.abortController.signal,
								},
							})
						}
						captions={video.captions}
						setCaptions={(updater) => {
							dispatch({
								type: 'embed_update_video',
								videoAction: {
									type: 'update_captions',
									updater,
									signal: video.abortController.signal,
								},
							});
						}}
					/>
				</div>
			)}
			{embed.quote?.uri ? (
				<div className={video ? styles.quoteContainerWithVideo : styles.quoteContainerWithoutVideo}>
					<div style={{ position: 'relative' }}>
						<LazyQuoteEmbed uri={embed.quote.uri} linkDisabled />
						{canRemoveQuote && (
							<ExternalEmbedRemoveBtn
								onRemove={() => dispatch({ type: 'embed_remove_quote' })}
								className={styles.externalEmbedRemoveBtn}
							/>
						)}
					</div>
				</div>
			) : null}
		</>
	);
}

function useScrollTracker({
	scrollViewRef,
	stickyBottom,
}: {
	scrollViewRef: React.RefObject<HTMLDivElement | null>;
	stickyBottom: boolean;
}) {
	const [isScrolled, setIsScrolled] = useState(false);
	const contentOffset = useRef(0);
	const scrollViewHeight = useRef(Infinity);
	const contentHeight = useRef(0);

	const scrollHandler = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		const el = event.currentTarget;
		contentOffset.current = Math.floor(el.scrollTop);
		contentHeight.current = Math.floor(el.scrollHeight);
		scrollViewHeight.current = Math.floor(el.clientHeight);

		const scrolled = el.scrollTop > 0;
		setIsScrolled((prev) => {
			if (prev !== scrolled) {
				return scrolled;
			}
			return prev;
		});
	}, []);

	useEffect(() => {
		const el = scrollViewRef.current;
		if (!el) {
			return;
		}

		const handleResize = () => {
			const newContentHeight = Math.floor(el.scrollHeight);
			const oldContentHeight = contentHeight.current;
			let shouldScrollToBottom = false;
			if (stickyBottom && newContentHeight > oldContentHeight) {
				const isFairlyCloseToBottom =
					oldContentHeight - contentOffset.current - 100 <= scrollViewHeight.current;
				if (isFairlyCloseToBottom) {
					shouldScrollToBottom = true;
				}
			}
			contentHeight.current = newContentHeight;
			scrollViewHeight.current = Math.floor(el.clientHeight);
			if (shouldScrollToBottom) {
				el.scrollTo({ top: newContentHeight, behavior: 'smooth' });
			}
		};

		contentHeight.current = Math.floor(el.scrollHeight);
		scrollViewHeight.current = Math.floor(el.clientHeight);

		const observer = new ResizeObserver(handleResize);
		const target = el.firstElementChild || el;
		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [scrollViewRef, stickyBottom]);

	return {
		scrollHandler,
		isScrolled,
	};
}

async function whenAppViewReady(
	appview: Client,
	uri: string,
	fn: (res: AppBskyUnspeccedGetPostThreadV2.$output) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() =>
			ok(
				appview.get('app.bsky.unspecced.getPostThreadV2', {
					params: {
						anchor: uri as ResourceUri,
						above: false,
						below: 0,
						branchingFactor: 0,
					},
				}),
			),
	);
}

function isEmptyPost(post: PostDraft) {
	return post.text.trim().length === 0 && !post.embed.media && !post.embed.link && !post.embed.quote;
}

export type CancelRef = {
	/** Returns `true` if the composer should stay open, `false` if the caller should close it. */
	onPressCancel: () => boolean;
};
