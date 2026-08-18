import {
	Fragment,
	memo,
	type RefObject,
	type UIEvent,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';

import { ClientResponseError, ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { isGraphemeLengthInRange } from '@atcute/util-text';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { EmbeddingDisabledError } from '#/lib/api/resolve';
import { MAX_DRAFT_GRAPHEME_LENGTH, MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { VIDEO_UPLOAD_MIME_TYPES } from '#/lib/constants/video';
import { cleanError } from '#/lib/errors';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { type ComposerImage, createComposerImage } from '#/lib/media/composer-image';
import { getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import type { VideoAsset } from '#/lib/media/video/types';
import { postUriToTarget } from '#/lib/routes/targets';
import { retry } from '#/lib/utils/retry';

import { postCreated } from '#/state/events';
import { useRequireAltTextEnabled } from '#/state/preferences/alt-text';
import { savePostLanguageToHistory, toPostLanguages, usePostLanguage } from '#/state/preferences/languages';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import { getClients, useSession } from '#/state/session';

import { ComposerReplyTo } from '#/features/composer/ComposerReplyTo';
import { ExternalEmbedGif, ExternalEmbedLink } from '#/features/composer/ExternalEmbed';
import { ExternalEmbedRemoveBtn } from '#/features/composer/ExternalEmbedRemoveBtn';
import { GifAltText } from '#/features/composer/GifAltText';
import {
	closeComposer,
	COMPOSER_DIALOG_ID,
	type ComposerOpts,
	type OnPostSuccessData,
} from '#/features/composer/open-composer';
import { Gallery } from '#/features/composer/photos/Gallery';
import { publishThread, ReplyDeletedError } from '#/features/composer/publish-thread';
import { SuggestedLanguage } from '#/features/composer/select-language/SuggestedLanguage';
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import { TextInput } from '#/features/composer/text-input/TextInput';
import { SubtitleDialogBtn } from '#/features/composer/videos/SubtitleDialog';
import { VideoPreview } from '#/features/composer/videos/VideoPreview';

import * as Dialog from '#/components/Dialog';
import { closeAllDialogs } from '#/components/Dialog/registry';
import { GalleryBleed } from '#/components/images/Gallery';
import { LazyQuoteEmbed } from '#/components/Post/Embed/LazyQuoteEmbed';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

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
import { createAddImagesWithCap } from './gallery-cap';
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

const getDraftSaveError = (error: unknown): string => {
	if (error instanceof ClientResponseError && error.error === 'DraftLimitReached') {
		return m['view.composer.drafts.error.max']();
	}
	return m['view.composer.drafts.error.save']();
};

type Props = ComposerOpts;
export const ComposePost = ({
	replyTo,
	onPost,
	onPostSuccess,
	quote: initQuote,
	mention: initMention,
	text: initText,
	videoUri: initVideoUri,
	cancelRef,
}: Props & {
	cancelRef?: RefObject<CancelRef | null>;
}) => {
	const { currentAccount } = useSession();
	const { appview, pds, pdsUrl } = getClients();
	const queryClient = useQueryClient();
	const currentDid = currentAccount!.did;
	const requireAltTextEnabled = useRequireAltTextEnabled();
	const postLanguage = usePostLanguage();
	const textInputRef = useRef<TextInputRef>(null);
	const discardPromptHandle = Prompt.usePromptHandle();
	const emptyPostsPromptHandle = Prompt.usePromptHandle();
	const skipEmptyConfirmedRef = useRef(false);
	const { mutateAsync: saveDraft } = useSaveDraftMutation();
	const { mutate: cleanupPublishedDraft } = useCleanupPublishedDraftMutation();
	const { data: preferences } = usePreferencesQuery();
	const router = useRouter();

	const [isPublishing, setIsPublishing] = useState(false);
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
	const currentLanguages = acceptedLanguageSuggestion
		? [acceptedLanguageSuggestion]
		: toPostLanguages(postLanguage);

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
	const dispatch = (postAction: PostAction) => {
		composerDispatch({
			type: 'updatePost',
			postId: activePost.id,
			postAction,
		});
	};

	const selectVideo = (postId: string, asset: VideoAsset) => {
		const abortController = new AbortController();
		composerDispatch({
			type: 'updatePost',
			postId: postId,
			postAction: {
				type: 'embedAddVideo',
				asset,
				abortController,
			},
		});
		if (!pds || !pdsUrl) {
			return;
		}
		void processVideo(
			asset,
			(videoAction) => {
				composerDispatch({
					type: 'updatePost',
					postId: postId,
					postAction: {
						type: 'embedUpdateVideo',
						videoAction,
					},
				});
			},
			pdsUrl,
			pds,
			currentDid,
			abortController.signal,
		);
	};

	const onInitVideo = useEffectEvent(() => {
		if (initVideoUri) {
			selectVideo(activePost.id, initVideoUri);
		}
	});

	useEffect(() => {
		onInitVideo();
	}, []);

	const clearVideo = (postId: string) => {
		composerDispatch({
			type: 'updatePost',
			postId: postId,
			postAction: {
				type: 'embedRemoveVideo',
			},
		});
	};

	const restoreVideo = async (postId: string, videoInfo: RestoredVideo) => {
		try {
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
				type: 'updatePost',
				postId,
				postAction: {
					type: 'embedAddVideo',
					asset,
					abortController,
				},
			});

			// Restore alt text immediately
			if (videoInfo.altText) {
				composerDispatch({
					type: 'updatePost',
					postId,
					postAction: {
						type: 'embedUpdateVideo',
						videoAction: {
							type: 'updateAltText',
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
					type: 'updatePost',
					postId,
					postAction: {
						type: 'embedUpdateVideo',
						videoAction: {
							type: 'updateCaptions',
							updater: () => captionTracks,
							signal: abortController.signal,
						},
					},
				});
			}

			// Start video compression and upload
			if (!pds || !pdsUrl) {
				return;
			}
			void processVideo(
				asset,
				(videoAction) => {
					composerDispatch({
						type: 'updatePost',
						postId,
						postAction: {
							type: 'embedUpdateVideo',
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
			console.error('Failed to restore video from draft', postId, e);
		}
	};

	const handleSelectDraft = async (draftSummary: DraftSummary) => {
		// Load local media files for the draft
		const { loadedMedia } = await loadDraftMedia(draftSummary.draft);

		// Extract original localRefs for orphan detection on save
		const originalLocalRefs = extractLocalRefs(draftSummary.draft);

		// Convert server draft to composer posts (videos returned separately)
		const { posts, restoredVideos } = await draftToComposerPosts(draftSummary.draft, loadedMedia);

		// Dispatch restore action (this also sets draftId in state)
		composerDispatch({
			type: 'restoreFromDraft',
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
	};

	const [publishOnUpload, setPublishOnUpload] = useState(false);
	// monotonic token bumped (during render) when a publish queued on upload completion is ready to fire.
	// consumed once by the effect below via a handled-ref, so the publish side effect runs after commit
	// without any setState landing in the effect body.
	const [uploadCompletionPublishRequest, setUploadCompletionPublishRequest] = useState(0);
	const handledUploadCompletionPublishRequestRef = useRef(0);

	const validateDraftTextOrError = (): boolean => {
		const tooLong = composerState.thread.posts.some(
			(post) => !isGraphemeLengthInRange(post.text, 0, MAX_DRAFT_GRAPHEME_LENGTH),
		);
		if (tooLong) {
			setError(m['view.composer.drafts.error.tooLong']({ max: MAX_DRAFT_GRAPHEME_LENGTH }));
			return false;
		}
		return true;
	};

	const handleSaveDraft = async () => {
		setError('');
		if (!validateDraftTextOrError()) {
			return;
		}
		try {
			const result = await saveDraft({
				composerState,
				existingDraftId: composerState.draftId,
			});
			composerDispatch({ type: 'markSaved', draftId: result.draftId });

			closeComposer();
		} catch (e) {
			console.error('Failed to save draft', e);
			setError(getDraftSaveError(e));
		}
	};

	// Save without closing - for use by DraftsButton
	const saveCurrentDraft = async (): Promise<{
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
			composerDispatch({ type: 'markSaved', draftId: result.draftId });
			return { success: true };
		} catch (e) {
			setError(getDraftSaveError(e));
			return { success: false };
		}
	};

	// Check if composer is empty (no content to save)
	const firstPost = thread.posts[0]!;
	const isComposerEmpty =
		thread.posts.length === 1 &&
		firstPost.text.trim().length === 0 &&
		!firstPost.embed.link &&
		!firstPost.embed.media &&
		!firstPost.embed.quote;

	// Clear the composer (discard current content)
	const handleClearComposer = () => {
		composerDispatch({
			type: 'clear',
			initInteractionSettings: preferences?.postInteractionSettings,
		});
	};

	/**
	 * decides how to handle a cancel request (Cancel button, Escape, backdrop press).
	 *
	 * @returns true if the composer should stay open (e.g., a sub-popup was closed or discard prompt shown), or
	 *   false if the caller should close the composer.
	 */
	const onPressCancel = (): boolean => {
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
	};

	useImperativeHandle(cancelRef, () => ({ onPressCancel }));

	// The Cancel button drives the close itself (the dialog's `onOpenChange` does it for Escape/backdrop).
	const onRequestClose = () => {
		if (!onPressCancel()) {
			closeComposer();
		}
	};

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
				(post.shortenedGraphemeLength <= MAX_POST_GRAPHEME_LENGTH &&
					!(post.embed.media?.type === 'video' && post.embed.media.video.status === 'error')),
		);

	const getFilteredThread = (): {
		type: 'none' | 'trailingOnly' | 'nonTrailing';
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
			type: hasNonTrailingEmpty ? 'nonTrailing' : 'trailingOnly',
			filteredThread,
		};
	};

	const onPressPublish = async () => {
		if (isPublishing) {
			return;
		}

		if (!canPost) {
			return;
		}

		const { type: emptyType, filteredThread } = getFilteredThread();

		if (emptyType === 'nonTrailing' && !skipEmptyConfirmedRef.current) {
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

		let postUri: ResourceUri | undefined;
		try {
			postUri = (
				await publishThread({ appview, did: currentDid, pds: pds! }, queryClient, {
					thread: filteredThread,
					replyTo: replyTo?.uri,
					langs: currentLanguages,
				})
			).uris[0];
		} catch (e: unknown) {
			console.error('Composer: create post failed', e);
			let err = cleanError(e);
			if (e instanceof ReplyDeletedError || err.includes('not locate record')) {
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
		if (composerState.draftId && composerState.originalLocalRefs) {
			cleanupPublishedDraft({
				draftId: composerState.draftId,
				originalLocalRefs: composerState.originalLocalRefs,
			});
		}
		savePostLanguageToHistory();

		// avoid retaining draft media while the app view catches up
		const postCount = filteredThread.posts.length;
		void (async () => {
			let postSuccessData: OnPostSuccessData;
			try {
				if (postUri) {
					const posts = await retry(
						5,
						(_e) => true,
						async () => {
							const data = await ok(
								appview.get('app.bsky.unspecced.getPostThreadV2', {
									params: {
										anchor: postUri,
										above: false,
										below: postCount - 1,
										branchingFactor: 1,
									},
								}),
							);
							if (data.thread.length !== postCount) {
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
			} catch {}

			onPost?.(postUri);
			onPostSuccess?.(postSuccessData);
		})().catch((e: unknown) => {
			console.error('Composer: post-publish notify failed', e);
		});

		closeComposer();
		setTimeout(() => {
			Toast.show(
				postCount > 1
					? m['view.composer.publish.postsSent']()
					: replyTo
						? m['view.composer.publish.replySent']()
						: m['view.composer.publish.postSent'](),
				{
					action: postUri
						? {
								label: m['view.composer.publish.action.view'](),
								onPress: () => {
									router.navigate({ to: postUriToTarget(postUri) });
								},
							}
						: undefined,
					type: 'success',
				},
			);
		}, 500);
	};

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
			if (isEmptyPost(post)) {
				continue;
			}
			if (post.embed.media?.type !== 'video') {
				continue;
			}
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
						type: 'addPost',
					});
				}}
				currentLanguages={currentLanguages}
				onSelectLanguage={onSelectLanguage}
				languageNudgeAt={languageNudgeAt}
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
				onCancel={onRequestClose}
				onPublish={() => void onPressPublish()}
				onSelectDraft={(draftSummary) => void handleSelectDraft(draftSummary)}
				onSaveDraft={saveCurrentDraft}
				onDiscard={handleClearComposer}
				isEmpty={isComposerEmpty}
				isDirty={composerState.isDirty}
				isEditingDraft={!!composerState.draftId}
				canSaveDraft={allPostsWithinLimit}
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
					onConfirm={closeComposer}
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
							onPress={closeComposer}
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
	textInputRef: RefObject<TextInputRef | null> | null;
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

	const dispatchPost = (action: PostAction) => {
		dispatch({
			type: 'updatePost',
			postId: post.id,
			postAction: action,
		});
	};

	const postImagesCount =
		post.embed.media?.type === 'images' || post.embed.media?.type === 'gallery'
			? post.embed.media.images.length
			: 0;
	const onImageAdd = createAddImagesWithCap(postImagesCount, dispatchPost);

	const onNewLink = (uri: string) => {
		dispatchPost({ type: 'embedAddUri', uri });
	};

	const onPhotoPasted = async (blob: Blob) => {
		const mimeType = blob.type;
		if (mimeType.startsWith('video/') || mimeType === 'image/gif') {
			if (!VIDEO_UPLOAD_MIME_TYPES.some((supported) => supported === mimeType)) {
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
				console.error('createComposerImage failed', blob.type, blob.size, e);
				onError(m['view.composer.gallery.error.paste']());
				return;
			}
			onImageAdd([image]);
		}
	};

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
						setText={(nextText) => {
							dispatchPost({ type: 'updateText', text: nextText });
						}}
						onFocus={() => {
							dispatch({
								type: 'focusPost',
								postId: post.id,
							});
						}}
						onPhotoPasted={(blob) => void onPhotoPasted(blob)}
						onNewLink={onNewLink}
						onError={onError}
						onPressPublish={onPublish}
						accessibilityLabel={m['common.compose.action.write']()}
						accessibilityHint={m['view.composer.text.maxLengthHint']({
							count: MAX_POST_GRAPHEME_LENGTH || 0,
						})}
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
											type: 'removePost',
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
										type: 'removePost',
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
						text={post.text}
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
	text,
}: {
	embed: EmbedDraft;
	dispatch: (action: PostAction) => void;
	clearVideo: () => void;
	canRemoveQuote: boolean;
	isActivePost: boolean;
	text: string;
}) {
	const video = embed.media?.type === 'video' ? embed.media.video : null;
	return (
		<>
			{(embed.media?.type === 'images' || embed.media?.type === 'gallery') && (
				<Gallery images={embed.media.images} dispatch={dispatch} text={text} />
			)}
			{embed.media?.type === 'gif' && (
				<div className={styles.gifContainer} key={embed.media.gif.url}>
					<ExternalEmbedGif gif={embed.media.gif} onRemove={() => dispatch({ type: 'embedRemoveGif' })} />
					<GifAltText
						gif={embed.media.gif}
						altText={embed.media.alt ?? ''}
						onSubmit={(altText: string) => {
							dispatch({ type: 'embedUpdateGif', alt: altText });
						}}
					/>
				</div>
			)}
			{!embed.media && embed.link && (
				<div className={styles.linkContainer} key={embed.link.uri}>
					<ExternalEmbedLink
						uri={embed.link.uri}
						hasQuote={!!embed.quote}
						onRemove={() => dispatch({ type: 'embedRemoveLink' })}
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
								type: 'embedUpdateVideo',
								videoAction: {
									type: 'updateAltText',
									altText,
									signal: video.abortController.signal,
								},
							})
						}
						captions={video.captions}
						setCaptions={(updater) => {
							dispatch({
								type: 'embedUpdateVideo',
								videoAction: {
									type: 'updateCaptions',
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
								onRemove={() => dispatch({ type: 'embedRemoveQuote' })}
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
	scrollViewRef: RefObject<HTMLDivElement | null>;
	stickyBottom: boolean;
}) {
	const [isScrolled, setIsScrolled] = useState(false);
	const contentOffset = useRef(0);
	const scrollViewHeight = useRef(Infinity);
	const contentHeight = useRef(0);

	const scrollHandler = (event: UIEvent<HTMLDivElement>) => {
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
	};

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

function isEmptyPost(post: PostDraft) {
	return post.text.trim().length === 0 && !post.embed.media && !post.embed.link && !post.embed.quote;
}

export type CancelRef = {
	/** Returns `true` if the composer should stay open, `false` if the caller should close it. */
	onPressCancel: () => boolean;
};
