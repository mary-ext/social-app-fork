import { memo, useMemo } from 'react';
import type {
	AnyProfileView,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { getCurrentRoute } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import type { Richtext } from '#/lib/strings/rich-text-facets';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { toShareUrl } from '#/lib/strings/url-helpers';

import type { Shadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useHiddenPosts, useHiddenPostsApi, useLanguagePrefs } from '#/state/preferences';
import { usePinnedPostMutation } from '#/state/queries/pinned-post';
import { usePostDeleteMutation, useThreadMuteMutationQueue } from '#/state/queries/post';
import { useToggleQuoteDetachmentMutation } from '#/state/queries/postgate';
import { getMaybeDetachedQuoteEmbed } from '#/state/queries/postgate/util';
import { useProfileBlockMutationQueue, useProfileMuteMutationQueue } from '#/state/queries/profile';
import {
	InvalidInteractionSettingsError,
	MAX_HIDDEN_REPLIES,
	MaxHiddenRepliesError,
	useToggleReplyVisibilityMutation,
} from '#/state/queries/threadgate';
import { useRequireAuth, useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';

import { logger } from '#/logger';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import {
	PostInteractionSettingsDialog,
	usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog';
import { Atom_Stroke2_Corner0_Rounded as AtomIcon } from '#/components/icons/Atom';
import { BubbleQuestion_Stroke2_Corner0_Rounded as Translate } from '#/components/icons/Bubble';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import {
	EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
	EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Filter_Stroke2_Corner0_Rounded as Filter } from '#/components/icons/Filter';
import {
	Mute_Stroke2_Corner0_Rounded as Mute,
	Mute_Stroke2_Corner0_Rounded as MuteIcon,
} from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonX } from '#/components/icons/Person';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { SettingsGear2_Stroke2_Corner0_Rounded as Gear } from '#/components/icons/SettingsGear2';
import {
	SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute,
	SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon,
} from '#/components/icons/Speaker';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import { Loader } from '#/components/Loader';
import { BlockAccountPrompt } from '#/components/moderation/block-account-prompt';
import { MuteAccountPrompt } from '#/components/moderation/mute-account-prompt';
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import { useDialogHandle } from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

import * as Clipboard from '#/shims/clipboard';
import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';

let PostMenuItems = ({
	post,
	postFeedContext,
	postReqId,
	record,
	richText,
	threadgateRecord,
	onShowLess,
	logContext: _logContext,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	postFeedContext: string | undefined;
	postReqId: string | undefined;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
	logContext: 'FeedItem' | 'PostThreadItem' | 'Post';
}): React.ReactNode => {
	const { hasSession, currentAccount } = useSession();
	const { t: l } = useLingui();
	const [debugFeedContextEnabled] = useDebugFeedContextEnabled();
	const langPrefs = useLanguagePrefs();
	const { mutateAsync: deletePostMutate } = usePostDeleteMutation();
	const { mutateAsync: pinPostMutate, isPending: isPinPending } = usePinnedPostMutation();
	const requireSignIn = useRequireAuth();
	const hiddenPosts = useHiddenPosts();
	const { hidePost } = useHiddenPostsApi();
	const feedFeedback = useFeedFeedbackContext();
	const openLink = useOpenLink();
	const translate = useGoogleTranslate();
	const navigation = useNavigation<NavigationProp>();
	const { mutedWordsDialogControl } = useGlobalDialogsControlContext();
	const blockPromptControl = Prompt.usePromptHandle();
	const mutePromptControl = Prompt.usePromptHandle();
	const reportDialogControl = useReportDialogControl();
	const deletePromptControl = Prompt.usePromptHandle();
	const hidePromptControl = Prompt.usePromptHandle();
	const postInteractionSettingsHandle = useDialogHandle();
	const quotePostDetachConfirmControl = Prompt.usePromptHandle();
	const hideReplyConfirmControl = Prompt.usePromptHandle();
	const { mutateAsync: toggleReplyVisibility } = useToggleReplyVisibilityMutation();

	const postUri = post.uri;
	const postCid = post.cid;
	const postAuthor = useProfileShadow(post.author as AnyProfileView);
	const quoteEmbed = useMemo(() => {
		if (!currentAccount || !post.embed) return;
		return getMaybeDetachedQuoteEmbed({
			viewerDid: currentAccount.did,
			post,
		});
	}, [post, currentAccount]);

	const rootUri = record.reply?.root?.uri || postUri;
	const isReply = Boolean(record.reply);
	const [isThreadMuted, muteThread, unmuteThread] = useThreadMuteMutationQueue(post, rootUri);
	const isPostHidden = hiddenPosts && hiddenPosts.includes(postUri);
	const isAuthor = postAuthor.did === currentAccount?.did;
	const isRootPostAuthor = parseCanonicalResourceUri(rootUri).repo === currentAccount?.did;
	const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
		threadgateRecord,
	});
	const isReplyHiddenByThreadgate = threadgateHiddenReplies.has(postUri);
	const isPinned = post.viewer?.pinned;

	const { mutateAsync: toggleQuoteDetachment, isPending: isDetachPending } =
		useToggleQuoteDetachmentMutation();

	const [queueBlock] = useProfileBlockMutationQueue(postAuthor);
	const [queueMute, queueUnmute] = useProfileMuteMutationQueue(postAuthor);

	const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
		postUri: post.uri,
		rootPostUri: rootUri,
	});

	const href = useMemo(() => {
		const urip = parseCanonicalResourceUri(postUri);
		return makeProfileLink(postAuthor, 'post', urip.rkey);
	}, [postUri, postAuthor]);

	const onDeletePost = () => {
		deletePostMutate({ uri: postUri }).then(
			() => {
				Toast.show(l({ message: 'Post deleted', context: 'toast' }));

				const route = getCurrentRoute(navigation.getState());
				if (route.name === 'PostThread') {
					const params = route.params as CommonNavigatorParams['PostThread'];
					if (
						currentAccount &&
						isAuthor &&
						(params.name === currentAccount.handle || params.name === currentAccount.did)
					) {
						const currentHref = makeProfileLink(postAuthor, 'post', params.rkey);
						if (currentHref === href && navigation.canGoBack()) {
							navigation.goBack();
						}
					}
				}
			},
			(e) => {
				logger.error('Failed to delete post', { message: e });
				Toast.show(l`Failed to delete post, please try again`, {
					type: 'error',
				});
			},
		);
	};

	const onToggleThreadMute = () => {
		try {
			if (isThreadMuted) {
				void unmuteThread();
				Toast.show(l`You will now receive notifications for this thread`);
			} else {
				void muteThread();
				Toast.show(l`You will no longer receive notifications for this thread`);
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to toggle thread mute', { message: e });
				Toast.show(l`Failed to toggle thread mute, please try again`, {
					type: 'error',
				});
			}
		}
	};

	const onToggleWordsAndTagsMute = () => {
		mutedWordsDialogControl.open();
	};

	const onCopyPostText = () => {
		const str = richTextToString(richText, true);

		void Clipboard.setStringAsync(str);
		Toast.show(l`Copied to clipboard`, {
			type: 'success',
		});
	};

	const onPressTranslate = () => {
		void translate(record.text, langPrefs.primaryLanguage);
	};

	const onHidePost = () => {
		hidePost({ uri: postUri });
	};

	const hideInPWI = !!postAuthor.labels?.find((label) => label.val === '!no-unauthenticated');

	const onPressShowMore = () => {
		feedFeedback.sendInteraction({
			event: 'app.bsky.feed.defs#requestMore',
			item: postUri,
			feedContext: postFeedContext,
			reqId: postReqId,
		});
		Toast.show(l({ message: 'Feedback sent to feed operator', context: 'toast' }));
	};

	const onPressShowLess = () => {
		feedFeedback.sendInteraction({
			event: 'app.bsky.feed.defs#requestLess',
			item: postUri,
			feedContext: postFeedContext,
			reqId: postReqId,
		});
		if (onShowLess) {
			onShowLess({
				item: postUri,
				feedContext: postFeedContext,
			});
		} else {
			Toast.show(l({ message: 'Feedback sent to feed operator', context: 'toast' }));
		}
	};

	const onToggleQuotePostAttachment = async () => {
		if (!quoteEmbed) return;

		const action = quoteEmbed.isDetached ? 'reattach' : 'detach';
		const isDetach = action === 'detach';

		try {
			await toggleQuoteDetachment({
				post,
				quoteUri: quoteEmbed.uri,
				action: quoteEmbed.isDetached ? 'reattach' : 'detach',
			});
			Toast.show(isDetach ? l`Quote post was successfully detached` : l`Quote post was re-attached`);
		} catch (err) {
			const e = err as Error;
			Toast.show(l({ message: 'Updating quote attachment failed', context: 'toast' }));
			logger.error(`Failed to ${action} quote`, { safeMessage: e.message });
		}
	};

	const canHidePostForMe = !isAuthor && !isPostHidden;
	const canHideReplyForEveryone = !isAuthor && isRootPostAuthor && !isPostHidden && isReply;
	const canDetachQuote = quoteEmbed && quoteEmbed.isOwnedByViewer;

	const onToggleReplyVisibility = async () => {
		// TODO no threadgate?
		if (!canHideReplyForEveryone) return;

		const action = isReplyHiddenByThreadgate ? 'show' : 'hide';
		const isHide = action === 'hide';

		try {
			await toggleReplyVisibility({
				postUri: rootUri,
				replyUri: postUri,
				action,
			});

			// Log metric only when hiding (not when showing)
			if (isHide) {
			}

			Toast.show(
				isHide
					? l`Reply was successfully hidden`
					: l({ message: 'Reply visibility updated', context: 'toast' }),
			);
		} catch (err) {
			const e = err as Error;
			if (e instanceof MaxHiddenRepliesError) {
				Toast.show(
					plural(MAX_HIDDEN_REPLIES, {
						other: 'You can hide a maximum of # replies.',
					}),
				);
			} else if (e instanceof InvalidInteractionSettingsError) {
				Toast.show(l({ message: 'Invalid interaction settings.', context: 'toast' }));
			} else {
				Toast.show(
					l({
						message: 'Updating reply visibility failed',
						context: 'toast',
					}),
				);
				logger.error(`Failed to ${action} reply`, { safeMessage: e.message });
			}
		}
	};

	const onPressPin = () => {
		void pinPostMutate({
			postUri,
			postCid,
			action: isPinned ? 'unpin' : 'pin',
		});
	};

	const onBlockAuthor = async () => {
		try {
			await queueBlock();
			Toast.show(l({ message: 'Account blocked', context: 'toast' }));
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to block account', { message: e });
				Toast.show(l`There was an issue! ${e.toString()}`, {
					type: 'error',
				});
			}
		} finally {
		}
	};

	const onMuteAuthor = async () => {
		if (postAuthor.viewer?.muted) {
			try {
				await queueUnmute();
				Toast.show(l({ message: 'Account unmuted', context: 'toast' }));
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unmute account', { message: e });
					Toast.show(l`There was an issue! ${e.toString()}`, {
						type: 'error',
					});
				}
			} finally {
			}
		} else {
			try {
				await queueMute();
				Toast.show(l({ message: 'Account muted', context: 'toast' }));
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to mute account', { message: e });
					Toast.show(l`There was an issue! ${e.toString()}`, {
						type: 'error',
					});
				}
			} finally {
			}
		}
	};

	const onReportMisclassification = () => {
		const url = `https://docs.google.com/forms/d/e/1FAIpQLSd0QPqhNFksDQf1YyOos7r1ofCLvmrKAH1lU042TaS3GAZaWQ/viewform?entry.1756031717=${toShareUrl(
			href,
		)}`;
		void openLink(url);
	};

	const onSignIn = () => requireSignIn(() => {});

	const isDiscoverDebugUser = debugFeedContextEnabled;

	return (
		<>
			<Menu.Popup label={l`Post options`} align="end">
				{isAuthor && (
					<>
						<Menu.Group>
							<Menu.Item
								label={isPinned ? l`Unpin from profile` : l`Pin to your profile`}
								disabled={isPinPending}
								onClick={onPressPin}
							>
								<Menu.ItemText>{isPinned ? l`Unpin from profile` : l`Pin to your profile`}</Menu.ItemText>
								<Menu.ItemIcon icon={isPinPending ? Loader : PinIcon} position="right" />
							</Menu.Item>
						</Menu.Group>
						<Menu.Separator />
					</>
				)}

				<Menu.Group>
					{!hideInPWI || hasSession ? (
						<>
							<Menu.Item label={l`Translate`} onClick={onPressTranslate}>
								<Menu.ItemText>{l`Translate`}</Menu.ItemText>
								<Menu.ItemIcon icon={Translate} position="right" />
							</Menu.Item>

							<Menu.Item label={l`Copy post text`} onClick={onCopyPostText}>
								<Menu.ItemText>{l`Copy post text`}</Menu.ItemText>
								<Menu.ItemIcon icon={ClipboardIcon} position="right" />
							</Menu.Item>
						</>
					) : (
						<Menu.Item label={l`Sign in to view post`} onClick={onSignIn}>
							<Menu.ItemText>{l`Sign in to view post`}</Menu.ItemText>
							<Menu.ItemIcon icon={Eye} position="right" />
						</Menu.Item>
					)}
				</Menu.Group>

				{hasSession && feedFeedback.enabled && (
					<>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item label={l`Show more like this`} onClick={onPressShowMore}>
								<Menu.ItemText>{l`Show more like this`}</Menu.ItemText>
								<Menu.ItemIcon icon={EmojiSmile} position="right" />
							</Menu.Item>

							<Menu.Item label={l`Show less like this`} onClick={onPressShowLess}>
								<Menu.ItemText>{l`Show less like this`}</Menu.ItemText>
								<Menu.ItemIcon icon={EmojiSad} position="right" />
							</Menu.Item>
						</Menu.Group>
					</>
				)}

				{isDiscoverDebugUser && (
					<>
						<Menu.Separator />
						<Menu.Item label={l`Assign topic for algo`} onClick={onReportMisclassification}>
							<Menu.ItemText>{l`Assign topic for algo`}</Menu.ItemText>
							<Menu.ItemIcon icon={AtomIcon} position="right" />
						</Menu.Item>
					</>
				)}

				{hasSession && (
					<>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item
								label={isThreadMuted ? l`Unmute thread` : l`Mute thread`}
								onClick={onToggleThreadMute}
							>
								<Menu.ItemText>{isThreadMuted ? l`Unmute thread` : l`Mute thread`}</Menu.ItemText>
								<Menu.ItemIcon icon={isThreadMuted ? Unmute : Mute} position="right" />
							</Menu.Item>

							<Menu.Item label={l`Mute words & tags`} onClick={onToggleWordsAndTagsMute}>
								<Menu.ItemText>{l`Mute words & tags`}</Menu.ItemText>
								<Menu.ItemIcon icon={Filter} position="right" />
							</Menu.Item>
						</Menu.Group>
					</>
				)}

				{hasSession && (canHideReplyForEveryone || canDetachQuote || canHidePostForMe) && (
					<>
						<Menu.Separator />
						<Menu.Group>
							{canHidePostForMe && (
								<Menu.Item
									label={isReply ? l`Hide reply for me` : l`Hide post for me`}
									onClick={() => hidePromptControl.open(null)}
								>
									<Menu.ItemText>{isReply ? l`Hide reply for me` : l`Hide post for me`}</Menu.ItemText>
									<Menu.ItemIcon icon={EyeSlash} position="right" />
								</Menu.Item>
							)}
							{canHideReplyForEveryone && (
								<Menu.Item
									label={isReplyHiddenByThreadgate ? l`Show reply for everyone` : l`Hide reply for everyone`}
									onClick={
										isReplyHiddenByThreadgate
											? onToggleReplyVisibility
											: () => hideReplyConfirmControl.open(null)
									}
								>
									<Menu.ItemText>
										{isReplyHiddenByThreadgate ? l`Show reply for everyone` : l`Hide reply for everyone`}
									</Menu.ItemText>
									<Menu.ItemIcon icon={isReplyHiddenByThreadgate ? Eye : EyeSlash} position="right" />
								</Menu.Item>
							)}

							{canDetachQuote && (
								<Menu.Item
									disabled={isDetachPending}
									label={quoteEmbed.isDetached ? l`Re-attach quote` : l`Detach quote`}
									onClick={
										quoteEmbed.isDetached
											? onToggleQuotePostAttachment
											: () => quotePostDetachConfirmControl.open(null)
									}
								>
									<Menu.ItemText>
										{quoteEmbed.isDetached ? l`Re-attach quote` : l`Detach quote`}
									</Menu.ItemText>
									<Menu.ItemIcon
										icon={isDetachPending ? Loader : quoteEmbed.isDetached ? Eye : EyeSlash}
										position="right"
									/>
								</Menu.Item>
							)}
						</Menu.Group>
					</>
				)}

				{hasSession && (
					<>
						<Menu.Separator />
						<Menu.Group>
							{!isAuthor && (
								<>
									<Menu.Item
										label={postAuthor.viewer?.muted ? l`Unmute account` : l`Mute account`}
										onClick={() => mutePromptControl.open(null)}
									>
										<Menu.ItemText>
											{postAuthor.viewer?.muted ? l`Unmute account` : l`Mute account`}
										</Menu.ItemText>
										<Menu.ItemIcon icon={postAuthor.viewer?.muted ? UnmuteIcon : MuteIcon} position="right" />
									</Menu.Item>

									{!postAuthor.viewer?.blocking && (
										<Menu.Item label={l`Block account`} onClick={() => blockPromptControl.open(null)}>
											<Menu.ItemText>{l`Block account`}</Menu.ItemText>
											<Menu.ItemIcon icon={PersonX} position="right" />
										</Menu.Item>
									)}

									<Menu.Item label={l`Report post`} onClick={() => reportDialogControl.open()}>
										<Menu.ItemText>{l`Report post`}</Menu.ItemText>
										<Menu.ItemIcon icon={Warning} position="right" />
									</Menu.Item>
								</>
							)}

							{isAuthor && (
								<>
									<Menu.Item
										label={l`Edit interaction settings`}
										onClick={() => postInteractionSettingsHandle.open(null)}
										onMouseEnter={() => void prefetchPostInteractionSettings()}
									>
										<Menu.ItemText>{l`Edit interaction settings`}</Menu.ItemText>
										<Menu.ItemIcon icon={Gear} position="right" />
									</Menu.Item>
									<Menu.Item label={l`Delete post`} onClick={() => deletePromptControl.open(null)}>
										<Menu.ItemText>{l`Delete post`}</Menu.ItemText>
										<Menu.ItemIcon icon={Trash} position="right" />
									</Menu.Item>
								</>
							)}
						</Menu.Group>
					</>
				)}
			</Menu.Popup>
			<Prompt.Basic
				handle={deletePromptControl}
				title={l`Delete this post?`}
				description={l`If you remove this post, you won't be able to recover it.`}
				onConfirm={onDeletePost}
				confirmButtonCta={l`Delete`}
				confirmButtonColor="negative"
			/>
			<Prompt.Basic
				handle={hidePromptControl}
				title={isReply ? l`Hide this reply?` : l`Hide this post?`}
				description={l`This post will be hidden from feeds and threads. This cannot be undone.`}
				onConfirm={onHidePost}
				confirmButtonCta={l`Hide`}
			/>
			<ReportDialog
				control={reportDialogControl}
				subject={{
					...post,
					$type: 'app.bsky.feed.defs#postView',
				}}
				onAfterSubmit={() => {}}
			/>
			<PostInteractionSettingsDialog
				handle={postInteractionSettingsHandle}
				postUri={post.uri}
				rootPostUri={rootUri}
				initialThreadgateView={post.threadgate}
			/>
			<Prompt.Basic
				handle={quotePostDetachConfirmControl}
				title={l`Detach quote post?`}
				description={l`This will remove your post from this quote post for all users, and replace it with a placeholder.`}
				onConfirm={() => void onToggleQuotePostAttachment()}
				confirmButtonCta={l`Yes, detach`}
			/>
			<Prompt.Basic
				handle={hideReplyConfirmControl}
				title={l`Hide this reply?`}
				description={l`This reply will be sorted into a hidden section at the bottom of your thread and will mute notifications for subsequent replies - both for yourself and others.`}
				onConfirm={() => void onToggleReplyVisibility()}
				confirmButtonCta={l`Yes, hide`}
			/>
			<BlockAccountPrompt
				handle={blockPromptControl}
				isBlocking={!!postAuthor.viewer?.blocking}
				isLabeler={!!postAuthor.associated?.labeler}
				onConfirm={() => void onBlockAuthor()}
			/>
			<MuteAccountPrompt
				handle={mutePromptControl}
				isMuted={!!postAuthor.viewer?.muted}
				onConfirm={() => void onMuteAuthor()}
			/>
		</>
	);
};
PostMenuItems = memo(PostMenuItems);
export { PostMenuItems };
