import { useMemo } from 'react';

import type {
	AnyProfileView,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useNavigation } from '@react-navigation/native';

import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';
import { getCurrentRoute } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import type { Richtext } from '#/lib/strings/rich-text-facets';
import { richTextToString } from '#/lib/strings/rich-text-helpers';

import type { Shadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useLanguagePrefs } from '#/state/preferences';
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

import {
	PostInteractionSettingsDialog,
	usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog';
import { BubbleQuestion_Stroke2_Corner0_Rounded as Translate } from '#/components/icons/Bubble';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import {
	EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
	EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
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
import * as Menu from '#/components/Menu';
import { BlockAccountPrompt } from '#/components/moderation/block-account-prompt';
import { MuteAccountPrompt } from '#/components/moderation/mute-account-prompt';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

const MenuSpinner = () => <Spinner color="default" label={m['common.status.loading']()} size="lg" />;

function PostMenuItems({
	post,
	postFeedContext,
	postReqId,
	record,
	richText,
	threadgateRecord,
	onShowLess,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	postFeedContext: string | undefined;
	postReqId: string | undefined;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
}): React.ReactNode {
	const { hasSession, currentAccount } = useSession();
	const langPrefs = useLanguagePrefs();
	const { mutateAsync: deletePostMutate } = usePostDeleteMutation();
	const { mutateAsync: pinPostMutate, isPending: isPinPending } = usePinnedPostMutation();
	const requireSignIn = useRequireAuth();
	const feedFeedback = useFeedFeedbackContext();
	const translate = useGoogleTranslate();
	const navigation = useNavigation<NavigationProp>();
	const blockPromptHandle = Prompt.usePromptHandle();
	const mutePromptHandle = Prompt.usePromptHandle();
	const reportDialogHandle = Dialog.useDialogHandle();
	const deletePromptHandle = Prompt.usePromptHandle();
	const postInteractionSettingsHandle = Dialog.useDialogHandle();
	const quotePostDetachConfirmHandle = Prompt.usePromptHandle();
	const hideReplyConfirmHandle = Prompt.usePromptHandle();
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
				Toast.show(m['components.postControls.delete.toast']());

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
				Toast.show(m['components.postControls.delete.error'](), {
					type: 'error',
				});
			},
		);
	};

	const onToggleThreadMute = () => {
		try {
			if (isThreadMuted) {
				void unmuteThread();
				Toast.show(m['components.postControls.thread.mute.toast']());
			} else {
				void muteThread();
				Toast.show(m['components.postControls.thread.unmute.toast']());
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to toggle thread mute', { message: e });
				Toast.show(m['components.postControls.thread.muteError'](), {
					type: 'error',
				});
			}
		}
	};

	const onCopyPostText = () => {
		const str = richTextToString(richText, true);

		void navigator.clipboard.writeText(str);
		Toast.show(m['common.share.copiedToast'](), {
			type: 'success',
		});
	};

	const onPressTranslate = () => {
		void translate(record.text, langPrefs.primaryLanguage);
	};

	const hideInPWI = !!postAuthor.labels?.find((label) => label.val === '!no-unauthenticated');

	const onPressShowMore = () => {
		feedFeedback.sendInteraction({
			event: 'app.bsky.feed.defs#requestMore',
			item: postUri,
			feedContext: postFeedContext,
			reqId: postReqId,
		});
		Toast.show(m['components.postControls.feedback.sentToast']());
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
			Toast.show(m['components.postControls.feedback.sentToast']());
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
			Toast.show(
				isDetach
					? m['components.postControls.quote.detach.toast']()
					: m['components.postControls.quote.reattach.toast'](),
			);
		} catch (err) {
			const e = err as Error;
			Toast.show(m['components.postControls.quote.updateError']());
			logger.error(`Failed to ${action} quote`, { safeMessage: e.message });
		}
	};

	const canHideReplyForEveryone = !isAuthor && isRootPostAuthor && isReply;
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
					? m['components.postControls.replyVisibility.hide.toast']()
					: m['components.postControls.replyVisibility.updatedToast'](),
			);
		} catch (err) {
			const e = err as Error;
			if (e instanceof MaxHiddenRepliesError) {
				Toast.show(m['components.postControls.replyVisibility.maxHidden']({ limit: MAX_HIDDEN_REPLIES }));
			} else if (e instanceof InvalidInteractionSettingsError) {
				Toast.show(m['components.postControls.interaction.error']());
			} else {
				Toast.show(m['components.postControls.replyVisibility.updateError']());
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
			Toast.show(m['common.block.blockedToast']());
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to block account', { message: e });
				Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), {
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
				Toast.show(m['common.mute.unmutedToast']());
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unmute account', { message: e });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), {
						type: 'error',
					});
				}
			} finally {
			}
		} else {
			try {
				await queueMute();
				Toast.show(m['common.mute.mutedToast']());
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to mute account', { message: e });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), {
						type: 'error',
					});
				}
			} finally {
			}
		}
	};

	const onSignIn = () => requireSignIn(() => {});

	return (
		<>
			<Menu.Popup label={m['components.postControls.options.label']()} align="end">
				{isAuthor && (
					<>
						<Menu.Group>
							<Menu.Item
								label={
									isPinned
										? m['components.postControls.pin.action.unpin']()
										: m['components.postControls.pin.action.pin']()
								}
								disabled={isPinPending}
								onClick={onPressPin}
							>
								<Menu.ItemText>
									{isPinned
										? m['components.postControls.pin.action.unpin']()
										: m['components.postControls.pin.action.pin']()}
								</Menu.ItemText>
								<Menu.ItemIcon icon={isPinPending ? MenuSpinner : PinIcon} position="right" />
							</Menu.Item>
						</Menu.Group>
						<Menu.Separator />
					</>
				)}

				<Menu.Group>
					{!hideInPWI || hasSession ? (
						<>
							<Menu.Item label={m['common.action.translate']()} onClick={onPressTranslate}>
								<Menu.ItemText>{m['common.action.translate']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Translate} position="right" />
							</Menu.Item>

							<Menu.Item label={m['components.postControls.copy.text']()} onClick={onCopyPostText}>
								<Menu.ItemText>{m['components.postControls.copy.text']()}</Menu.ItemText>
								<Menu.ItemIcon icon={ClipboardIcon} position="right" />
							</Menu.Item>
						</>
					) : (
						<Menu.Item label={m['components.postControls.visibility.signIn']()} onClick={onSignIn}>
							<Menu.ItemText>{m['components.postControls.visibility.signIn']()}</Menu.ItemText>
							<Menu.ItemIcon icon={Eye} position="right" />
						</Menu.Item>
					)}
				</Menu.Group>

				{hasSession && feedFeedback.enabled && (
					<>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item label={m['components.postControls.feedback.showMore']()} onClick={onPressShowMore}>
								<Menu.ItemText>{m['components.postControls.feedback.showMore']()}</Menu.ItemText>
								<Menu.ItemIcon icon={EmojiSmile} position="right" />
							</Menu.Item>

							<Menu.Item label={m['components.postControls.feedback.showLess']()} onClick={onPressShowLess}>
								<Menu.ItemText>{m['components.postControls.feedback.showLess']()}</Menu.ItemText>
								<Menu.ItemIcon icon={EmojiSad} position="right" />
							</Menu.Item>
						</Menu.Group>
					</>
				)}

				{hasSession && (
					<>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item
								label={
									isThreadMuted
										? m['components.postControls.thread.unmute.action']()
										: m['components.postControls.thread.mute.action']()
								}
								onClick={onToggleThreadMute}
							>
								<Menu.ItemText>
									{isThreadMuted
										? m['components.postControls.thread.unmute.action']()
										: m['components.postControls.thread.mute.action']()}
								</Menu.ItemText>
								<Menu.ItemIcon icon={isThreadMuted ? Unmute : Mute} position="right" />
							</Menu.Item>
						</Menu.Group>
					</>
				)}

				{hasSession && (canHideReplyForEveryone || canDetachQuote) && (
					<>
						<Menu.Separator />
						<Menu.Group>
							{canHideReplyForEveryone && (
								<Menu.Item
									label={
										isReplyHiddenByThreadgate
											? m['components.postControls.replyVisibility.show.action']()
											: m['components.postControls.replyVisibility.hide.action']()
									}
									onClick={
										isReplyHiddenByThreadgate
											? onToggleReplyVisibility
											: () => hideReplyConfirmHandle.open(null)
									}
								>
									<Menu.ItemText>
										{isReplyHiddenByThreadgate
											? m['components.postControls.replyVisibility.show.action']()
											: m['components.postControls.replyVisibility.hide.action']()}
									</Menu.ItemText>
									<Menu.ItemIcon icon={isReplyHiddenByThreadgate ? Eye : EyeSlash} position="right" />
								</Menu.Item>
							)}

							{canDetachQuote && (
								<Menu.Item
									disabled={isDetachPending}
									label={
										quoteEmbed.isDetached
											? m['components.postControls.quote.reattach.action']()
											: m['components.postControls.quote.detach.action']()
									}
									onClick={
										quoteEmbed.isDetached
											? onToggleQuotePostAttachment
											: () => quotePostDetachConfirmHandle.open(null)
									}
								>
									<Menu.ItemText>
										{quoteEmbed.isDetached
											? m['components.postControls.quote.reattach.action']()
											: m['components.postControls.quote.detach.action']()}
									</Menu.ItemText>
									<Menu.ItemIcon
										icon={isDetachPending ? MenuSpinner : quoteEmbed.isDetached ? Eye : EyeSlash}
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
										label={
											postAuthor.viewer?.muted
												? m['common.mute.action.unmuteAccount']()
												: m['common.mute.action.muteAccount']()
										}
										onClick={() => mutePromptHandle.open(null)}
									>
										<Menu.ItemText>
											{postAuthor.viewer?.muted
												? m['common.mute.action.unmuteAccount']()
												: m['common.mute.action.muteAccount']()}
										</Menu.ItemText>
										<Menu.ItemIcon icon={postAuthor.viewer?.muted ? UnmuteIcon : MuteIcon} position="right" />
									</Menu.Item>

									{!postAuthor.viewer?.blocking && (
										<Menu.Item
											label={m['common.block.action.blockAccount']()}
											onClick={() => blockPromptHandle.open(null)}
										>
											<Menu.ItemText>{m['common.block.action.blockAccount']()}</Menu.ItemText>
											<Menu.ItemIcon icon={PersonX} position="right" />
										</Menu.Item>
									)}

									<Menu.Item
										label={m['components.postControls.report.post']()}
										onClick={() => reportDialogHandle.open(null)}
									>
										<Menu.ItemText>{m['components.postControls.report.post']()}</Menu.ItemText>
										<Menu.ItemIcon icon={Warning} position="right" />
									</Menu.Item>
								</>
							)}

							{isAuthor && (
								<>
									<Menu.Item
										label={m['components.postControls.interaction.edit']()}
										onClick={() => postInteractionSettingsHandle.open(null)}
										onMouseEnter={() => void prefetchPostInteractionSettings()}
									>
										<Menu.ItemText>{m['components.postControls.interaction.edit']()}</Menu.ItemText>
										<Menu.ItemIcon icon={Gear} position="right" />
									</Menu.Item>
									<Menu.Item label={m['common.post.delete']()} onClick={() => deletePromptHandle.open(null)}>
										<Menu.ItemText>{m['common.post.delete']()}</Menu.ItemText>
										<Menu.ItemIcon icon={Trash} position="right" />
									</Menu.Item>
								</>
							)}
						</Menu.Group>
					</>
				)}
			</Menu.Popup>
			<Prompt.Basic
				handle={deletePromptHandle}
				title={m['components.postControls.delete.title']()}
				description={m['components.postControls.delete.message']()}
				onConfirm={onDeletePost}
				confirmButtonCta={m['common.action.delete']()}
				confirmButtonColor="negative"
			/>
			<ReportDialog
				handle={reportDialogHandle}
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
				handle={quotePostDetachConfirmHandle}
				title={m['components.postControls.quote.detach.title']()}
				description={m['components.postControls.quote.detach.message']()}
				onConfirm={() => void onToggleQuotePostAttachment()}
				confirmButtonCta={m['components.postControls.quote.detach.confirm']()}
			/>
			<Prompt.Basic
				handle={hideReplyConfirmHandle}
				title={m['components.postControls.replyVisibility.hide.title']()}
				description={m['components.postControls.replyVisibility.hide.message']()}
				onConfirm={() => void onToggleReplyVisibility()}
				confirmButtonCta={m['components.postControls.replyVisibility.hide.confirm']()}
			/>
			<BlockAccountPrompt
				handle={blockPromptHandle}
				isBlocking={!!postAuthor.viewer?.blocking}
				isLabeler={!!postAuthor.associated?.labeler}
				onConfirm={() => void onBlockAuthor()}
			/>
			<MuteAccountPrompt
				handle={mutePromptHandle}
				isMuted={!!postAuthor.viewer?.muted}
				onConfirm={() => void onMuteAuthor()}
			/>
		</>
	);
}
export { PostMenuItems };
