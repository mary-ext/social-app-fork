import { type ReactNode, useMemo } from 'react';

import type {
	AnyProfileView,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { isAbortError } from '#/lib/errors';
import { type Richtext, richTextToCopyableText } from '#/lib/rich-text';

import type { Shadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { usePrimaryLanguage } from '#/state/preferences/languages';
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
import { useIsReplyHidden } from '#/state/threadgate-hidden-replies';

import { isPostInLanguage } from '#/locale/helpers';

import * as Dialog from '#/components/Dialog';
import {
	PostInteractionSettingsDialog,
	usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog';
import * as Menu from '#/components/Menu';
import { BlockAccountPrompt } from '#/components/moderation/block-account-prompt';
import { MuteAccountPrompt } from '#/components/moderation/mute-account-prompt';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';

import ClipboardIcon from '#/icons/central/Clipboard_round_outlined_radius1_stroke2.svg';
import EmojiSad from '#/icons/central/EmojiSad_round_outlined_radius1_stroke2.svg';
import EmojiSmile from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import Warning from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import Eye from '#/icons/central/EyeOpen_round_outlined_radius1_stroke2.svg';
import EyeSlash from '#/icons/central/EyeSlash_round_outlined_radius1_stroke2.svg';
import Mute from '#/icons/central/Mute_round_outlined_radius1_stroke2.svg';
import PersonX from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import Gear from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import PinIcon from '#/icons/central/Thumbtack_round_outlined_radius1_stroke2.svg';
import Translate from '#/icons/central/Translate_round_outlined_radius1_stroke2.svg';
import Trash from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import Unmute from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

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
}): ReactNode {
	const { hasSession, currentAccount } = useSession();
	const { mutateAsync: deletePostMutate } = usePostDeleteMutation();
	const { mutateAsync: pinPostMutate, isPending: isPinPending } = usePinnedPostMutation();
	const requireSignIn = useRequireAuth();
	const feedFeedback = useFeedFeedbackContext();
	const primaryLanguage = usePrimaryLanguage();
	const router = useRouter();
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
		if (!currentAccount || !post.embed) {
			return;
		}
		return getMaybeDetachedQuoteEmbed({
			viewerDid: currentAccount.did,
			post,
		});
	}, [post, currentAccount]);

	const rootUri = record.reply?.root?.uri || postUri;
	const isReply = !!record.reply;
	const [isThreadMuted, muteThread, unmuteThread] = useThreadMuteMutationQueue(post, rootUri);
	const isAuthor = postAuthor.did === currentAccount?.did;
	const isRootPostAuthor = parseCanonicalResourceUri(rootUri).repo === currentAccount?.did;
	const isReplyHiddenByThreadgate = useIsReplyHidden(postUri, threadgateRecord);
	const isPinned = post.viewer?.pinned;

	const { mutateAsync: toggleQuoteDetachment, isPending: isDetachPending } =
		useToggleQuoteDetachmentMutation();

	const [queueBlock] = useProfileBlockMutationQueue(postAuthor);
	const [queueMute, queueUnmute] = useProfileMuteMutationQueue(postAuthor);

	const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
		postUri: post.uri,
		rootPostUri: rootUri,
	});

	const onDeletePost = () => {
		deletePostMutate({ uri: postUri }).then(
			() => {
				Toast.show(m['components.postControls.delete.toast']());

				const target = router.target;
				if (target.name === 'PostThread') {
					// the open thread is the deleted post's own, so there is nothing left to return to
					const isViewingDeletedPost =
						currentAccount &&
						isAuthor &&
						(target.actor === currentAccount.handle || target.actor === currentAccount.did) &&
						target.rkey === parseCanonicalResourceUri(postUri).rkey;
					if (isViewingDeletedPost && router.canGoBack) {
						router.back();
					}
				}
			},
			(e) => {
				console.error('Failed to delete post', e);
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
			if (!isAbortError(err)) {
				console.error('Failed to toggle thread mute', err);
				Toast.show(m['components.postControls.thread.muteError'](), {
					type: 'error',
				});
			}
		}
	};

	const onCopyPostText = () => {
		const str = richTextToCopyableText(richText);

		void navigator.clipboard.writeText(str);
		Toast.show(m['common.share.copiedToast'](), {
			type: 'success',
		});
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
		if (!quoteEmbed) {
			return;
		}

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
			console.error(`Failed to ${action} quote`, err);
			Toast.show(m['components.postControls.quote.updateError']());
		}
	};

	const canHideReplyForEveryone = !isAuthor && isRootPostAuthor && isReply;
	const canDetachQuote = quoteEmbed !== undefined && quoteEmbed.isOwnedByViewer;
	const canTranslate = hasSession && record.text !== '' && !isPostInLanguage(post, [primaryLanguage]);

	const onToggleReplyVisibility = async () => {
		// TODO no threadgate?
		if (!canHideReplyForEveryone) {
			return;
		}

		const action = isReplyHiddenByThreadgate ? 'show' : 'hide';
		const isHide = action === 'hide';

		try {
			await toggleReplyVisibility({
				postUri: rootUri,
				replyUri: postUri,
				action,
			});

			Toast.show(
				isHide
					? m['components.postControls.replyVisibility.hide.toast']()
					: m['components.postControls.replyVisibility.updatedToast'](),
			);
		} catch (err) {
			if (err instanceof MaxHiddenRepliesError) {
				Toast.show(m['components.postControls.replyVisibility.maxHidden']({ limit: MAX_HIDDEN_REPLIES }));
			} else if (err instanceof InvalidInteractionSettingsError) {
				Toast.show(m['components.postControls.interaction.error']());
			} else {
				console.error(`Failed to ${action} reply`, err);
				Toast.show(m['components.postControls.replyVisibility.updateError']());
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
			if (!isAbortError(err)) {
				Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), {
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
				if (!isAbortError(err)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), {
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
				if (!isAbortError(err)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), {
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
							{canTranslate && (
								<Menu.Item
									label={m['components.post.translate.action.translate']()}
									onClick={() => {
										const { repo, rkey } = parseCanonicalResourceUri(postUri);
										router.navigate({ to: { name: 'PostThread', actor: repo, rkey, translate: true } });
									}}
								>
									<Menu.ItemText>{m['components.post.translate.action.translate']()}</Menu.ItemText>
									<Menu.ItemIcon icon={Translate} position="right" />
								</Menu.Item>
							)}
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
										<Menu.ItemIcon icon={postAuthor.viewer?.muted ? Unmute : Mute} position="right" />
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
					$type: 'app.bsky.feed.defs#postView',
					...post,
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
