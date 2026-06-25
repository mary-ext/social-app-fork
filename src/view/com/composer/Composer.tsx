import {
	Fragment,
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';
import {
	Keyboard,
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	type StyleProp,
	StyleSheet,
	View,
	type ViewStyle,
} from 'react-native';
import type { AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { isGraphemeLengthInRange } from '@atcute/util-text';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

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
import { colors as legacyColors } from '#/lib/styles';

import { useDialogStateControlContext } from '#/state/dialogs';
import { postCreated } from '#/state/events';
import { type ComposerImage, createComposerImage } from '#/state/gallery';
import { toPostLanguages, useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences/languages';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { CharProgress } from '#/view/com/composer/char-progress/CharProgress';
import { ComposerReplyTo } from '#/view/com/composer/ComposerReplyTo';
import { DraftsButton } from '#/view/com/composer/drafts/DraftsButton';
import { ExternalEmbedGif, ExternalEmbedLink } from '#/view/com/composer/ExternalEmbed';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import { GifAltText } from '#/view/com/composer/GifAltText';
import { LabelsBtn } from '#/view/com/composer/labels/LabelsBtn';
import { Gallery } from '#/view/com/composer/photos/Gallery';
import { SelectGifBtn } from '#/view/com/composer/photos/SelectGifBtn';
import { SuggestedLanguage } from '#/view/com/composer/select-language/SuggestedLanguage';
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import { TextInput } from '#/view/com/composer/text-input/TextInput';
import { ThreadgateBtn } from '#/view/com/composer/threadgate/ThreadgateBtn';
import { SubtitleDialogBtn } from '#/view/com/composer/videos/SubtitleDialog';
import { VideoPreview } from '#/view/com/composer/videos/VideoPreview';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon } from '#/components/Button';
import * as EmojiPicker from '#/components/EmojiPicker';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { LazyQuoteEmbed } from '#/components/Post/Embed/LazyQuoteEmbed';
import { ProgressCircle } from '#/components/progress-circle';
import { Spinner } from '#/components/Spinner';
import { Text as WebText } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';
import * as WebButton from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import type { Gif } from '#/features/gifPicker/types';
import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';
import { colors } from '#/styles/colors';

import * as topBarStyles from './Composer.css';
import { ComposerToolbarButton } from './ComposerToolbarButton';
import { draftToComposerPosts, extractLocalRefs, type RestoredVideo } from './drafts/state/api';
import {
	loadDraftMedia,
	useCleanupPublishedDraftMutation,
	useSaveDraftMutation,
} from './drafts/state/queries';
import type { DraftSummary } from './drafts/state/schema';
import { PostLanguageSelect } from './select-language/PostLanguageSelect';
import { type AssetType, SelectMediaButton, type SelectMediaButtonProps } from './SelectMediaButton';
import {
	type ComposerAction,
	composerReducer,
	createComposerState,
	type EmbedDraft,
	MAX_GALLERY_IMAGES,
	type PostAction,
	type PostDraft,
	type ThreadDraft,
} from './state/composer';
import { NO_VIDEO, type NoVideoState, processVideo, type VideoState } from './state/video';
import type { TextInputRef } from './text-input/TextInput.types';

export type CancelRef = {
	/** Returns `true` if the composer should stay open, `false` if the caller should close it. */
	onPressCancel: () => boolean;
};

type WebViewStyle = Omit<ViewStyle, 'maxHeight' | 'position'> & {
	maxHeight?: string;
	position?: 'sticky';
	scrollbarColor?: string;
	scrollbarGutter?: 'stable';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style as unknown as ViewStyle;
};

/** Minimum gap between honored language-detection nudges, so rapid detector firings don't re-pulse the button. */
const NUDGE_COOLDOWN_MS = 10_000;

function applyGalleryCap(
	currentCount: number,
	incoming: ComposerImage[],
):
	| { status: 'full' }
	| { status: 'partial'; accepted: ComposerImage[]; dropped: number }
	| { status: 'ok'; accepted: ComposerImage[] } {
	const remaining = MAX_GALLERY_IMAGES - currentCount;
	if (remaining <= 0) {
		return { status: 'full' };
	}
	if (incoming.length > remaining) {
		return {
			status: 'partial',
			accepted: incoming.slice(0, remaining),
			dropped: incoming.length - remaining,
		};
	}
	return { status: 'ok', accepted: incoming };
}

function useAddImagesWithCap(currentCount: number, dispatchPostAction: (action: PostAction) => void) {
	const { t: l } = useLingui();
	return useCallback(
		(next: ComposerImage[]) => {
			const result = applyGalleryCap(currentCount, next);
			if (result.status === 'full') {
				Toast.show(
					l({
						message: `You can only add up to ${plural(MAX_GALLERY_IMAGES, { other: '# images' })} per post`,
						comment:
							'Toast shown when the user tries to add more images but the post gallery is already at the cap',
					}),
					{ type: 'warning' },
				);
				return;
			}
			if (result.status === 'partial') {
				Toast.show(
					l({
						message: `Only ${result.accepted.length} of ${next.length} ${plural(next.length, { one: 'image', other: 'images' })} added; limit is ${MAX_GALLERY_IMAGES}`,
						comment:
							'Toast shown when adding images would exceed the post gallery cap; only the first N are kept',
					}),
					{ type: 'warning' },
				);
			}
			dispatchPostAction({
				type: 'embed_add_images',
				images: result.accepted,
			});
		},
		[currentCount, dispatchPostAction, l],
	);
}

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
	logContext: _logContext,
	cancelRef,
}: Props & {
	cancelRef?: React.RefObject<CancelRef | null>;
}) => {
	const { currentAccount } = useSession();
	const t = useTheme();
	const { appview, pds, pdsUrl } = useClients();
	const queryClient = useQueryClient();
	const currentDid = currentAccount!.did;
	const { closeComposer } = useComposerControls();
	const { t: l, i18n } = useLingui();
	const [requireAltTextEnabled] = useRequireAltTextEnabled();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();
	const textInputRef = useRef<TextInputRef>(null);
	const discardPromptControl = Prompt.usePromptHandle();
	const emptyPostsPromptControl = Prompt.usePromptHandle();
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
	 * When the user selects a language from the composer language selector, clear any temporary language
	 * suggestions they may have selected previously, and any we might try to suggest to them.
	 */
	const onSelectLanguage = () => {
		setAcceptedLanguageSuggestion(null);
		setReplyToLanguages([]);
	};

	/**
	 * Timestamp (ms) of the last honored nudge from language detection. Used to rate-limit the pulse animation:
	 * we ignore back-to-back nudges that arrive within NUDGE_COOLDOWN_MS. Consumers key an effect on this value
	 * — it only changes when we actually want to re-pulse.
	 */
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
				i18n,
			);
		},
		[i18n, pds, pdsUrl, currentDid, composerDispatch],
	);

	const onInitVideo = useNonReactiveCallback(() => {
		if (initVideoUri) {
			selectVideo(activePost.id, initVideoUri);
		}
	});

	useEffect(() => {
		onInitVideo();
	}, [onInitVideo]);

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
					i18n,
				);
			} catch (e) {
				logger.error('Failed to restore video from draft', {
					postId,
					error: e,
				});
			}
		},
		[i18n, pds, pdsUrl, currentDid, composerDispatch],
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

	const onClose = useCallback(() => {
		closeComposer();
	}, [closeComposer]);

	const getDraftSaveError = useCallback(
		(e: unknown): string => {
			if (e instanceof ClientResponseError && e.error === 'DraftLimitReached') {
				return l`You've reached the maximum number of drafts`;
			}
			return l`Failed to save draft`;
		},
		[l],
	);

	const validateDraftTextOrError = useCallback((): boolean => {
		const tooLong = composerState.thread.posts.some(
			(post) => !isGraphemeLengthInRange(post.text, 0, MAX_DRAFT_GRAPHEME_LENGTH),
		);
		if (tooLong) {
			setError(
				l`One or more posts are too long to save as a draft. ${plural(MAX_DRAFT_GRAPHEME_LENGTH, { one: 'The maximum number of characters is # character.', other: 'The maximum number of characters is # characters.' })}`,
			);
			return false;
		}
		return true;
	}, [composerState.thread.posts, l]);

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
	 * Decides what a cancel request (Cancel button, Escape, backdrop press) should do. Returns `true` when the
	 * composer should stay open (a sub-popup was closed, or the discard prompt was raised), `false` when the
	 * caller should close the composer. Kept side-effect-only so the host can own the actual close (avoids
	 * re-entrant `handle.close()` inside Base UI's `onOpenChange`).
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
			Keyboard.dismiss();
			discardPromptControl.open(null);
			return true;
		}
		return false;
	}, [thread, composerState.draftId, composerState.isDirty, closeAllDialogs, discardPromptControl]);

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
					return l`One or more images is missing alt text.`;
				}
				if (media.type === 'gif' && !media.alt) {
					return l`One or more GIFs is missing alt text.`;
				}
				if (media.type === 'video' && media.video.status !== 'error' && !media.video.altText) {
					return l`One or more videos is missing alt text.`;
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

	const getFilteredThread = (): {
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
	};

	const onPressPublish = useCallback(async () => {
		if (isPublishing) {
			return;
		}

		if (!canPost) {
			return;
		}

		const { type: emptyType, filteredThread } = getFilteredThread();

		if (emptyType === 'non-trailing' && !skipEmptyConfirmedRef.current) {
			emptyPostsPromptControl.open(null);
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
				err = l`We're sorry! The post you are replying to has been deleted.`;
			} else if (e instanceof EmbeddingDisabledError) {
				err = l`This post's author has disabled quote posts.`;
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
					? l`Your posts were sent`
					: replyTo
						? l`Your reply was sent`
						: l`Your post was sent`,
				{
					action: postUri
						? {
								label: l({
									context: 'Action to view the post the user just created',
									message: 'View',
								}),
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
		l,
		thread,
		canPost,
		isPublishing,
		currentLanguages,
		onClose,
		onPost,
		onPostSuccess,
		initQuote,
		replyTo,
		setLangPrefs,
		queryClient,
		navigation,
		composerState.draftId,
		composerState.originalLocalRefs,
		composerState.isDirty,
		cleanupPublishedDraft,
		emptyPostsPromptControl,
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

	useEffect(() => {
		if (publishOnUpload) {
			let erroredVideos = 0;
			let uploadingVideos = 0;
			for (let post of thread.posts) {
				if (isEmptyPost(post)) continue;
				if (post.embed.media?.type === 'video') {
					const video = post.embed.media.video;
					if (video.status === 'error') {
						erroredVideos++;
					} else if (video.status !== 'done') {
						uploadingVideos++;
					}
				}
			}
			if (erroredVideos > 0) {
				setPublishOnUpload(false);
			} else if (uploadingVideos === 0) {
				setPublishOnUpload(false);
				void onPressPublish();
			}
		}
	}, [thread.posts, onPressPublish, publishOnUpload]);

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

	const scrollViewRef = useRef<ScrollView | null>(null);
	useEffect(() => {
		if (composerState.mutableNeedsFocusActive) {
			composerState.mutableNeedsFocusActive = false;
			textInputRef.current?.focus();
		}
	}, [composerState]);

	const isLastThreadedPost = thread.posts.length > 1 && nextPost === undefined;
	const { scrollHandler, onScrollViewContentSizeChange, onScrollViewLayout, bottomBarAnimatedStyle } =
		useScrollTracker({
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
				bottomBarAnimatedStyle={bottomBarAnimatedStyle}
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
			{/* The composer owns its own scrolling (the `ScrollView` below); this body fills the
			    height-bounded dialog card while `minHeight: 0` lets the inner scroll view clip. */}
			<View style={[a.flex_1, { minHeight: 0 }]}>
				{missingAltError && <AltTextReminder error={missingAltError} />}
				<ErrorBanner
					error={error}
					videoState={erroredVideo}
					clearError={() => setError('')}
					clearVideo={erroredVideoPostId ? () => clearVideo(erroredVideoPostId) : () => {}}
				/>
				<ScrollView
					testID="composePostView"
					ref={scrollViewRef}
					onScroll={scrollHandler}
					contentContainerStyle={a.flex_grow}
					style={[
						a.flex_1,
						webViewStyle({
							scrollbarGutter: 'stable',
							scrollbarColor: `${t.palette.contrast_200} transparent`,
						}),
					]}
					keyboardShouldPersistTaps="always"
					onContentSizeChange={onScrollViewContentSizeChange}
					onLayout={onScrollViewLayout}
				>
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
								<View style={styles.stickyFooterWeb}>{footer}</View>
							)}
						</Fragment>
					))}
				</ScrollView>
				{!IS_WEBFooterSticky && footer}
			</View>

			{replyTo ? (
				<Prompt.Basic
					handle={discardPromptControl}
					title={l`Discard draft?`}
					confirmButtonCta={l`Discard`}
					confirmButtonColor="negative"
					onConfirm={handleDiscard}
				/>
			) : (
				<Prompt.Outer handle={discardPromptControl}>
					<Prompt.Content>
						<Prompt.TitleText>
							{allPostsWithinLimit ? (
								composerState.draftId ? (
									<Trans>Save changes?</Trans>
								) : (
									<Trans>Save draft?</Trans>
								)
							) : (
								<Trans>Discard post?</Trans>
							)}
						</Prompt.TitleText>
						<Prompt.DescriptionText>
							{allPostsWithinLimit ? (
								composerState.draftId ? (
									<Trans>You have unsaved changes to this draft, would you like to save them?</Trans>
								) : (
									<Trans>Would you like to save this as a draft to edit later?</Trans>
								)
							) : (
								<Trans>You can only save drafts up to 1000 characters.</Trans>
							)}
						</Prompt.DescriptionText>
					</Prompt.Content>
					<Prompt.Actions>
						{allPostsWithinLimit && (
							<Prompt.Action
								cta={composerState.draftId ? l`Save changes` : l`Save draft`}
								onPress={() => void handleSaveDraft()}
								color="primary"
							/>
						)}
						<Prompt.Action cta={l`Discard`} onPress={handleDiscard} color="negative_subtle" />
						<Prompt.Cancel cta={l`Keep editing`} />
					</Prompt.Actions>
				</Prompt.Outer>
			)}

			<Prompt.Basic
				handle={emptyPostsPromptControl}
				title={l`Skip empty posts?`}
				description={l`Your thread has empty posts that will be skipped. The remaining posts will be published as a thread.`}
				confirmButtonCta={l`Post anyway`}
				cancelButtonCta={l`Keep editing`}
				onConfirm={handleConfirmSkipEmpty}
			/>
		</>
	);
};

let ComposerPost = memo(function ComposerPost({
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
	const { t: l } = useLingui();
	const { data: currentProfile } = useProfileQuery({ did: currentDid });
	const text = post.text;
	const isTextOnly = !post.embed.link && !post.embed.quote && !post.embed.media;
	const forceMinHeight = isTextOnly && isActive;
	const selectTextInputPlaceholder = isReply
		? isFirstPost
			? l`Write your reply`
			: l`Add another post`
		: l`What's up?`;
	const discardPromptControl = Prompt.usePromptHandle();

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
					Toast.show(l`Unsupported video type: ${mimeType}`, {
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
					onError(l`The pasted image couldn't be added to your post.`);
					return;
				}
				onImageAdd([image]);
			}
		},
		[post.id, onSelectVideo, onImageAdd, onError, l],
	);

	return (
		<View style={[a.mx_lg, a.mb_sm, !isActive && isLastPost && a.mb_lg, !isActive && styles.inactivePost]}>
			<View style={[a.flex_row]}>
				<View style={[a.mt_xs]}>
					<UserAvatar
						avatar={currentProfile?.avatar}
						size={42}
						type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
					/>
				</View>
				<TextInput
					ref={textInputRef}
					style={[a.pt_xs]}
					text={text}
					placeholder={selectTextInputPlaceholder}
					autoFocus={isLastPost}
					webForceMinHeight={forceMinHeight}
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
					accessibilityLabel={l`Write post`}
					accessibilityHint={l`Compose posts up to ${plural(MAX_GRAPHEME_LENGTH || 0, {
						other: '# characters',
					})} in length`}
				/>
			</View>
			{canRemovePost && isActive && (
				<>
					<Button
						label={l`Delete post`}
						size="small"
						color="secondary"
						variant="ghost"
						shape="round"
						style={[a.absolute, { top: 0, right: 0 }]}
						onPress={() => {
							if (
								post.shortenedGraphemeLength > 0 ||
								post.embed.media ||
								post.embed.link ||
								post.embed.quote
							) {
								discardPromptControl.open(null);
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
						handle={discardPromptControl}
						title={l`Discard post?`}
						description={l`Are you sure you'd like to discard this post?`}
						onConfirm={() => {
							dispatch({
								type: 'remove_post',
								postId: post.id,
							});
						}}
						confirmButtonCta={l`Discard`}
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
		</View>
	);
});

function ComposerTopBar({
	canPost,
	isReply,
	isPublishQueued,
	isPublishing,
	isThread,
	publishingStage,
	onCancel,
	onPublish,
	onSelectDraft,
	onSaveDraft,
	onDiscard,
	isEmpty,
	isDirty,
	isEditingDraft,
	canSaveDraft,
	textLength,
}: {
	isPublishing: boolean;
	publishingStage: string;
	canPost: boolean;
	isReply: boolean;
	isPublishQueued: boolean;
	isThread: boolean;
	onCancel: () => void;
	onPublish: () => void;
	onSelectDraft: (draft: DraftSummary) => void;
	onSaveDraft: () => Promise<{ success: boolean }>;
	onDiscard: () => void;
	isEmpty: boolean;
	isDirty: boolean;
	isEditingDraft: boolean;
	canSaveDraft: boolean;
	textLength: number;
}) {
	const { t: l } = useLingui();

	return (
		<Dialog.Header.Outer border={false}>
			<Dialog.Header.Slot>
				<WebButton.Button label={l`Cancel`} onClick={onCancel} size="small" color="primary" variant="ghost">
					<WebButton.ButtonText size="md">
						<Trans>Cancel</Trans>
					</WebButton.ButtonText>
				</WebButton.Button>
			</Dialog.Header.Slot>
			<Dialog.Header.Slot>
				{isPublishing ? (
					<div className={topBarStyles.publishingRow}>
						<WebText color="textContrastMedium" size="md_sub">
							{publishingStage}
						</WebText>
						<Spinner color={colors.textContrastMedium} label={l`Publishing`} size="md" />
					</div>
				) : (
					<div className={topBarStyles.buttonRow}>
						{!isReply && (
							<DraftsButton
								onSelectDraft={onSelectDraft}
								onSaveDraft={onSaveDraft}
								onDiscard={onDiscard}
								isEmpty={isEmpty}
								isDirty={isDirty}
								isEditingDraft={isEditingDraft}
								canSaveDraft={canSaveDraft}
								textLength={textLength}
							/>
						)}
						<WebButton.Button
							label={
								isReply
									? isThread
										? l({
												message: 'Publish replies',
												comment: 'Accessibility label for button to publish multiple replies in a thread',
											})
										: l({
												message: 'Publish reply',
												comment: 'Accessibility label for button to publish a single reply',
											})
									: isThread
										? l({
												message: 'Publish posts',
												comment: 'Accessibility label for button to publish multiple posts in a thread',
											})
										: l({
												message: 'Publish post',
												comment: 'Accessibility label for button to publish a single post',
											})
							}
							color="primary"
							size="small"
							onClick={onPublish}
							disabled={!canPost || isPublishQueued}
						>
							<WebButton.ButtonText size="md">
								{isReply ? (
									<Trans context="action">Reply</Trans>
								) : isThread ? (
									<Trans context="action">Post All</Trans>
								) : (
									<Trans context="action">Post</Trans>
								)}
							</WebButton.ButtonText>
						</WebButton.Button>
					</div>
				)}
			</Dialog.Header.Slot>
		</Dialog.Header.Outer>
	);
}

function AltTextReminder({ error }: { error: string }) {
	return (
		<Admonition type="error" style={[a.mt_2xs, a.mb_sm, a.mx_lg]}>
			{error}
		</Admonition>
	);
}

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
				<View style={[a.relative, a.mt_lg]} key={embed.media.gif.url}>
					<ExternalEmbedGif gif={embed.media.gif} onRemove={() => dispatch({ type: 'embed_remove_gif' })} />
					<GifAltText
						gif={embed.media.gif}
						altText={embed.media.alt ?? ''}
						onSubmit={(altText: string) => {
							dispatch({ type: 'embed_update_gif', alt: altText });
						}}
					/>
				</View>
			)}
			{!embed.media && embed.link && (
				<View style={[a.relative, a.mt_lg]} key={embed.link.uri}>
					<ExternalEmbedLink
						uri={embed.link.uri}
						hasQuote={!!embed.quote}
						onRemove={() => dispatch({ type: 'embed_remove_link' })}
					/>
				</View>
			)}
			{video && (
				<View style={[a.w_full, a.mt_lg]}>
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
				</View>
			)}
			{embed.quote?.uri ? (
				<View style={[a.pb_sm, video ? [a.pt_md] : [a.pt_xl], a.pb_md]}>
					<View style={[a.relative]}>
						<LazyQuoteEmbed uri={embed.quote.uri} linkDisabled />
						{canRemoveQuote && (
							<ExternalEmbedRemoveBtn
								onRemove={() => dispatch({ type: 'embed_remove_quote' })}
								style={{ top: 16 }}
							/>
						)}
					</View>
				</View>
			) : null}
		</>
	);
}

function ComposerPills({
	isReply,
	thread,
	post,
	dispatch,
	bottomBarAnimatedStyle,
}: {
	isReply: boolean;
	thread: ThreadDraft;
	post: PostDraft;
	dispatch: (action: ComposerAction) => void;
	bottomBarAnimatedStyle: StyleProp<ViewStyle>;
}) {
	const t = useTheme();
	const media = post.embed.media;
	const hasMedia =
		media?.type === 'images' || media?.type === 'gallery' || media?.type === 'gif' || media?.type === 'video';
	const hasLink = !!post.embed.link;

	// Don't render anything if no pills are going to be displayed
	if (isReply && !hasMedia && !hasLink) {
		return null;
	}

	return (
		<View style={[a.flex_row, a.p_sm, t.atoms.bg, bottomBarAnimatedStyle]}>
			<ScrollView
				contentContainerStyle={[a.gap_sm]}
				horizontal={true}
				bounces={false}
				keyboardShouldPersistTaps="always"
				showsHorizontalScrollIndicator={false}
			>
				{isReply ? null : (
					<ThreadgateBtn
						postgate={thread.postgate}
						onChangePostgate={(nextPostgate) => {
							dispatch({ type: 'update_postgate', postgate: nextPostgate });
						}}
						threadgateAllowUISettings={thread.threadgate}
						onChangeThreadgateAllowUISettings={(nextThreadgate) => {
							dispatch({
								type: 'update_threadgate',
								threadgate: nextThreadgate,
							});
						}}
					/>
				)}
				{hasMedia || hasLink ? (
					<LabelsBtn
						labels={post.labels}
						onChange={(nextLabels) => {
							dispatch({
								type: 'update_post',
								postId: post.id,
								postAction: {
									type: 'update_labels',
									labels: nextLabels,
								},
							});
						}}
					/>
				) : null}
			</ScrollView>
		</View>
	);
}

function ComposerFooter({
	post,
	dispatch,
	showAddButton,
	onError,
	onSelectVideo,
	onAddPost,
	currentLanguages,
	onSelectLanguage,
	languageNudgeAt,
	openGallery,
	textInputRef,
}: {
	post: PostDraft;
	dispatch: (action: PostAction) => void;
	showAddButton: boolean;
	onError: (error: string) => void;
	onSelectVideo: (postId: string, asset: VideoAsset) => void;
	onAddPost: () => void;
	currentLanguages: string[];
	onSelectLanguage?: (language: string) => void;
	languageNudgeAt: number;
	openGallery?: boolean;
	textInputRef: React.RefObject<TextInputRef | null>;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { gtPhone } = useBreakpoints();
	const emojiPickerHandle = EmojiPicker.useEmojiPickerHandle();
	/*
	 * Once we've allowed a certain type of asset to be selected, we don't allow
	 * other types of media to be selected.
	 */
	const [selectedAssetsType, setSelectedAssetsType] = useState<AssetType | undefined>(undefined);

	const media = post.embed.media;
	const images = media?.type === 'images' || media?.type === 'gallery' ? media.images : [];
	const video = media?.type === 'video' ? media.video : null;
	const isMaxImages = images.length >= MAX_GALLERY_IMAGES;
	const isMaxVideos = !!video;

	let selectedAssetsCount = 0;
	let isMediaSelectionDisabled = false;

	if (media?.type === 'images' || media?.type === 'gallery') {
		isMediaSelectionDisabled = isMaxImages;
		selectedAssetsCount = images.length;
	} else if (media?.type === 'video') {
		isMediaSelectionDisabled = isMaxVideos;
		selectedAssetsCount = 1;
	} else {
		isMediaSelectionDisabled = !!media;
	}

	const onImageAdd = useAddImagesWithCap(images.length, dispatch);

	const onSelectGif = useCallback(
		(gif: Gif) => {
			dispatch({ type: 'embed_add_gif', gif });
		},
		[dispatch],
	);

	/*
	 * Reset if the user clears any selected media
	 */
	if (selectedAssetsType !== undefined && !media) {
		setSelectedAssetsType(undefined);
	}

	const onSelectAssets = useCallback<SelectMediaButtonProps['onSelectAssets']>(
		async ({ type, images, video, errors }) => {
			setSelectedAssetsType(type);

			if (type === 'image' && images.length) {
				const results = await Promise.allSettled(images.map((image) => createComposerImage(image)));

				const selectedImages: ComposerImage[] = [];
				let failed = 0;

				for (const [index, result] of results.entries()) {
					if (result.status === 'fulfilled') {
						selectedImages.push(result.value);
					} else {
						failed++;
						const file = images[index]!;
						logger.error(`createComposerImage failed`, {
							safeMessage: result.reason instanceof Error ? result.reason.message : String(result.reason),
							mimeType: file.type,
							size: file.size,
						});
					}
				}

				if (selectedImages.length) {
					onImageAdd(selectedImages);
				}
				if (failed > 0) {
					onError(
						l`${plural(failed, {
							one: `An image couldn't be added to your post.`,
							other: `# images couldn't be added to your post.`,
						})}`,
					);
				}
			} else if ((type === 'video' || type === 'gif') && video) {
				onSelectVideo(post.id, video);
			}

			errors.map((error) => {
				Toast.show(error, {
					type: 'warning',
				});
			});
		},
		[post.id, onSelectVideo, onImageAdd, onError, l],
	);

	return (
		<View
			style={[
				a.flex_row,
				a.py_xs,
				{ paddingLeft: 7, paddingRight: 16 },
				a.align_center,
				a.border_t,
				t.atoms.bg,
				t.atoms.border_contrast_medium,
				a.justify_between,
			]}
		>
			<View style={[a.flex_row, a.align_center]}>
				{video && video.status !== 'done' ? (
					<VideoUploadToolbar state={video} />
				) : (
					<ToolbarWrapper style={[a.flex_row, a.align_center, a.gap_xs]}>
						<SelectMediaButton
							disabled={isMediaSelectionDisabled}
							allowedAssetTypes={selectedAssetsType}
							selectedAssetsCount={selectedAssetsCount}
							onSelectAssets={onSelectAssets}
							autoOpen={openGallery}
						/>
						<SelectGifBtn onSelectGif={onSelectGif} disabled={!!media} />
						{gtPhone ? (
							<>
								<EmojiPicker.Trigger
									handle={emojiPickerHandle}
									render={<ComposerToolbarButton label={l`Open emoji picker`} icon={EmojiSmileIcon} />}
								/>
								<EmojiPicker.Root handle={emojiPickerHandle} nextFocusRef={textInputRef}>
									<EmojiPicker.Picker />
								</EmojiPicker.Root>
							</>
						) : null}
					</ToolbarWrapper>
				)}
			</View>
			<View style={[a.flex_row, a.align_center, a.justify_between]}>
				{showAddButton && (
					<ComposerToolbarButton label={l`Add another post to thread`} onClick={onAddPost} icon={PlusIcon} />
				)}
				<PostLanguageSelect
					currentLanguages={currentLanguages}
					onSelectLanguage={onSelectLanguage}
					nudgeAt={languageNudgeAt}
				/>
				<CharProgress count={post.shortenedGraphemeLength} style={{ width: 54 }} />
			</View>
		</View>
	);
}

function useScrollTracker({
	scrollViewRef,
	stickyBottom,
}: {
	scrollViewRef: React.RefObject<ScrollView | null>;
	stickyBottom: boolean;
}) {
	const contentOffset = useRef(0);
	const scrollViewHeight = useRef(Infinity);
	const contentHeight = useRef(0);

	const scrollHandler = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const ev = event.nativeEvent;
		contentOffset.current = Math.floor(ev.contentOffset.y);
		contentHeight.current = Math.floor(ev.contentSize.height);
		scrollViewHeight.current = Math.floor(ev.layoutMeasurement.height);
	}, []);

	const onScrollViewContentSizeChange = useCallback(
		(_width: number, height: number) => {
			const newContentHeight = Math.floor(height);
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
			if (shouldScrollToBottom) {
				scrollViewRef.current?.scrollTo({ x: 0, y: newContentHeight, animated: true });
			}
		},
		[scrollViewRef, stickyBottom],
	);

	const onScrollViewLayout = useCallback((evt: LayoutChangeEvent) => {
		scrollViewHeight.current = Math.floor(evt.nativeEvent.layout.height);
	}, []);

	const bottomBarAnimatedStyle: ViewStyle = {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: 'transparent',
	};

	return {
		scrollHandler,
		onScrollViewContentSizeChange,
		onScrollViewLayout,
		bottomBarAnimatedStyle,
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

const styles = StyleSheet.create({
	stickyFooterWeb: webViewStyle({
		position: 'sticky',
		bottom: 0,
	}),
	errorLine: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: legacyColors.red1,
		borderRadius: 6,
		marginHorizontal: 16,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginBottom: 8,
	},
	reminderLine: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 6,
		marginHorizontal: 16,
		paddingHorizontal: 8,
		paddingVertical: 6,
		marginBottom: 8,
	},
	errorIcon: {
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: legacyColors.red4,
		color: legacyColors.red4,
		borderRadius: 30,
		width: 16,
		height: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 5,
	},
	inactivePost: {
		opacity: 0.5,
	},
	addExtLinkBtn: {
		borderWidth: 1,
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginHorizontal: 10,
		marginBottom: 4,
	},
});

function ErrorBanner({
	error: standardError,
	videoState,
	clearError,
	clearVideo,
}: {
	error: string;
	videoState: VideoState | NoVideoState;
	clearError: () => void;
	clearVideo: () => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();

	const videoError = videoState.status === 'error' ? videoState.error : undefined;
	const error = standardError || videoError;

	const onClearError = () => {
		if (standardError) {
			clearError();
		} else {
			clearVideo();
		}
	};

	if (!error) return null;

	return (
		<View style={[a.px_lg, a.pb_sm]}>
			<View style={[a.px_md, a.py_sm, a.gap_xs, a.rounded_sm, t.atoms.bg_contrast_25]}>
				<View style={[a.relative, a.flex_row, a.gap_sm, { paddingRight: 48 }]}>
					<CircleInfoIcon fill={colors.negative_400} />
					<Text style={[a.flex_1, a.leading_snug, { paddingTop: 1 }]}>{error}</Text>
					<Button
						label={l`Dismiss error`}
						size="tiny"
						color="secondary"
						variant="ghost"
						shape="round"
						style={[a.absolute, { top: 0, right: 0 }]}
						onPress={onClearError}
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				</View>
				{videoError && videoState.jobId && (
					<Text
						style={[
							{ paddingLeft: 28 },
							a.text_xs,
							a.font_semi_bold,
							a.leading_snug,
							t.atoms.text_contrast_low,
						]}
					>
						<Trans>Job ID: {videoState.jobId}</Trans>
					</Text>
				)}
			</View>
		</View>
	);
}

function ToolbarWrapper({
	style: _style,
	children,
}: {
	style: StyleProp<ViewStyle>;
	children: React.ReactNode;
}) {
	return children;
}

function VideoUploadToolbar({ state }: { state: VideoState }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const progress = state.progress;
	const shouldRotate = state.status === 'processing' && (progress === 0 || progress === 1);
	let wheelProgress = shouldRotate ? 0.33 : progress;

	let text = '';

	const isGif = state.video?.mimeType === 'image/gif';

	switch (state.status) {
		case 'compressing':
			if (isGif) {
				text = l`Compressing GIF...`;
			} else {
				text = l`Compressing video...`;
			}
			break;
		case 'uploading':
			if (isGif) {
				text = l`Uploading GIF...`;
			} else {
				text = l`Uploading video...`;
			}
			break;
		case 'processing':
			if (isGif) {
				text = l`Processing GIF...`;
			} else {
				text = l`Processing video...`;
			}
			break;
		case 'error':
			text = l`Error`;
			wheelProgress = 100;
			break;
		case 'done':
			if (isGif) {
				text = l`GIF uploaded`;
			} else {
				text = l`Video uploaded`;
			}
			break;
	}

	return (
		<ToolbarWrapper style={[a.flex_row, a.align_center, { paddingVertical: 5 }]}>
			<ProgressCircle
				size={30}
				trackColor={t.atoms.border_contrast_low.borderColor}
				color={state.status === 'error' ? t.palette.negative_500 : t.palette.primary_500}
				progress={wheelProgress}
			/>
			<Text style={[a.font_semi_bold, a.ml_sm]}>{text}</Text>
		</ToolbarWrapper>
	);
}
