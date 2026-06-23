import { memo, useMemo } from 'react';
import type {
	AnyProfileView,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import type { Richtext } from '#/lib/strings/rich-text-facets';
import { niceDate } from '#/lib/strings/time';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import type { ThreadItem } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import type { PostSource } from '#/state/unstable-post-source';

import { ThreadItemAnchorFollowButton } from '#/screens/PostThread/components/ThreadItemAnchorFollowButton';

import { Button } from '#/components/Button';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon } from '#/components/icons/CalendarClock';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { GalleryBleed } from '#/components/images/Gallery';
import { ContentHider } from '#/components/moderation/ContentHider';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { TranslatedPost } from '#/components/Post/Translated';
import { AnchorPostControls, AnchorPostControlsSkeleton } from '#/components/PostControls/AnchorPostControls';
import { useFormatPostStatCount } from '#/components/PostControls/util';
import * as PostLayout from '#/components/PostLayout';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import { InlineLinkText } from '#/components/web/Link';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';
import * as Skele from '#/components/web/Skeleton';
import { WhoCanReply } from '#/components/WhoCanReply';

import { useActorStatus } from '#/features/liveNow';
import { colors } from '#/styles/colors';

import * as css from './ThreadItemAnchor.css';

export function ThreadItemAnchor({
	item,
	onPostSuccess,
	threadgateRecord,
	postSource,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	onPostSuccess?: (data: OnPostSuccessData) => void;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	postSource?: PostSource;
}) {
	const postShadow = usePostShadow(item.value.post);
	const threadRootUri = item.value.post.record.reply?.root?.uri || item.uri;
	const isRoot = threadRootUri === item.uri;

	if (postShadow === POST_TOMBSTONE) {
		return <ThreadItemAnchorDeleted isRoot={isRoot} />;
	}

	return (
		<ThreadItemAnchorInner
			// Safeguard from clobbering per-post state below:
			key={postShadow.uri}
			item={item}
			isRoot={isRoot}
			postShadow={postShadow}
			onPostSuccess={onPostSuccess}
			threadgateRecord={threadgateRecord}
			postSource={postSource}
		/>
	);
}

function ThreadItemAnchorDeleted({ isRoot }: { isRoot: boolean }) {
	return (
		<>
			<ThreadItemAnchorParentReplyLine isRoot={isRoot} />

			<div className={clsx(css.deletedOuter, isRoot && css.deletedOuterRoot)}>
				<div className={css.deletedRow}>
					<div className={css.deletedIcon}>
						<TrashIcon fill="currentColor" />
					</div>
					<Text size="md" weight="semiBold" color="textContrastMedium">
						<Trans>Post has been deleted</Trans>
					</Text>
				</div>
			</div>
		</>
	);
}

function ThreadItemAnchorParentReplyLine({ isRoot }: { isRoot: boolean }) {
	return !isRoot ? (
		<div className={css.parentLineRow}>
			<div className={css.parentLineColumn}>
				<PostLayout.Spine />
			</div>
		</div>
	) : null;
}

const ThreadItemAnchorInner = memo(function ThreadItemAnchorInner({
	item,
	isRoot,
	postShadow,
	onPostSuccess,
	threadgateRecord,
	postSource,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	isRoot: boolean;
	postShadow: Shadow<AppBskyFeedDefs.PostView>;
	onPostSuccess?: (data: OnPostSuccessData) => void;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	postSource?: PostSource;
}) {
	const { t: l } = useLingui();
	const { openComposer } = useOpenComposer();
	const { currentAccount, hasSession } = useSession();
	const feedFeedback = useFeedFeedback(postSource?.feedSourceInfo, hasSession);
	const formatPostStatCount = useFormatPostStatCount();

	const post = postShadow;
	const record = item.value.post.record;
	const moderation = item.moderation;
	const authorShadow = useProfileShadow(post.author as AnyProfileView);
	const { isActive: live } = useActorStatus(post.author);
	const richText: Richtext = useMemo(
		() => ({
			text: record.text,
			facets: record.facets,
		}),
		[record],
	);

	const threadRootUri = record.reply?.root?.uri || post.uri;
	const authorHref = makeProfileLink(post.author);
	const isThreadAuthor = getThreadAuthor(post, record) === currentAccount?.did;

	const likesHref = useMemo(() => {
		const urip = parseCanonicalResourceUri(post.uri);
		return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by');
	}, [post.uri, post.author]);
	const repostsHref = useMemo(() => {
		const urip = parseCanonicalResourceUri(post.uri);
		return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by');
	}, [post.uri, post.author]);
	const quotesHref = useMemo(() => {
		const urip = parseCanonicalResourceUri(post.uri);
		return makeProfileLink(post.author, 'post', urip.rkey, 'quotes');
	}, [post.uri, post.author]);

	const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
		threadgateRecord,
	});
	const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
		const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
		const isControlledByViewer = parseCanonicalResourceUri(threadRootUri).repo === currentAccount?.did;
		return isControlledByViewer && isPostHiddenByThreadgate
			? [
					{
						type: 'reply-hidden',
						source: { type: 'user', did: currentAccount?.did },
						priority: 6,
					},
				]
			: [];
	}, [post, currentAccount?.did, threadgateHiddenReplies, threadRootUri]);
	const onlyFollowersCanReply = !!threadgateRecord?.allow?.find(
		(rule) => rule.$type === 'app.bsky.feed.threadgate#followerRule',
	);
	const showFollowButton = currentAccount?.did !== post.author.did && !onlyFollowersCanReply;

	const viaRepost = useMemo(() => {
		const reason = postSource?.post.reason;

		if (reason?.$type === 'app.bsky.feed.defs#reasonRepost' && reason.uri && reason.cid) {
			return {
				uri: reason.uri,
				cid: reason.cid,
			};
		}
	}, [postSource]);

	const onPressReply = useNonReactiveCallback(() => {
		openComposer({
			replyTo: {
				uri: post.uri,
				cid: post.cid,
				text: record.text,
				author: post.author,
				embed: post.embed,
				moderation,
				langs: record.langs,
			},
			onPostSuccess: onPostSuccess,
			logContext: 'PostReply',
		});

		if (postSource) {
			feedFeedback.sendInteraction({
				item: post.uri,
				event: 'app.bsky.feed.defs#interactionReply',
				feedContext: postSource.post.feedContext,
				reqId: postSource.post.reqId,
			});
		}
	});

	const onOpenAuthor = () => {
		if (postSource) {
			feedFeedback.sendInteraction({
				item: post.uri,
				event: 'app.bsky.feed.defs#clickthroughAuthor',
				feedContext: postSource.post.feedContext,
				reqId: postSource.post.reqId,
			});
		}
	};

	const onOpenEmbed = () => {
		if (postSource) {
			feedFeedback.sendInteraction({
				item: post.uri,
				event: 'app.bsky.feed.defs#clickthroughEmbed',
				feedContext: postSource.post.feedContext,
				reqId: postSource.post.reqId,
			});
		}
	};

	return (
		<>
			<ThreadItemAnchorParentReplyLine isRoot={isRoot} />
			<GalleryBleed>
				<PostLayout.Frame rootPad={isRoot}>
					<div className={css.avatarRow}>
						<div>
							<PreviewableUserAvatar
								size={42}
								profile={post.author}
								moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
								type={post.author.associated?.labeler ? 'labeler' : 'user'}
								live={live}
								onBeforePress={onOpenAuthor}
								tabIndex={-1}
							/>
						</div>
						<div className={css.header}>
							<div className={css.nameRow}>
								<ProfileHoverCard did={post.author.did}>
									<InlineLinkText
										className={css.displayName}
										color="text"
										label={l`View profile`}
										numberOfLines={1}
										onPress={onOpenAuthor}
										size="lg"
										to={authorHref}
										weight="semiBold"
									>
										{sanitizeDisplayName(
											post.author.displayName || sanitizeHandle(post.author.handle),
											getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
										)}
									</InlineLinkText>
								</ProfileHoverCard>
								<div className={css.badges}>
									<ProfileBadges profile={authorShadow} size="md" interactive />
								</div>
							</div>
							<ProfileHoverCard did={post.author.did}>
								<InlineLinkText
									className={css.handle}
									color="textContrastMedium"
									label={l`View profile`}
									numberOfLines={1}
									onPress={onOpenAuthor}
									size="md"
									tabIndex={-1}
									to={authorHref}
									underline="none"
								>
									{sanitizeHandle(post.author.handle, '@')}
								</InlineLinkText>
							</ProfileHoverCard>
						</div>
						<div className={css.followCell}>
							<ThreadItemAnchorFollowButton did={post.author.did} enabled={showFollowButton} />
						</div>
					</div>
					<div className={css.body}>
						<LabelsOnMyPost className={css.labelsOnMe} post={post} />
						<ContentHider
							modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
							ignoreMute
							childContainerClassName={css.contentHiderChild}
						>
							<PostAlerts
								additionalCauses={additionalPostAlerts}
								className={css.postAlerts}
								modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
								size="lg"
							/>
							{richText?.text ? (
								<RichText
									enableTags
									selectable
									value={richText}
									size="lg"
									authorHandle={post.author.handle}
								/>
							) : undefined}
							<TranslatedPost post={post} />
							{post.embed && (
								<div className={richText?.text ? css.embedPad : undefined}>
									<Embed
										embed={post.embed}
										moderation={moderation}
										viewContext={PostEmbedViewContext.ThreadHighlighted}
										onOpen={onOpenEmbed}
									/>
								</div>
							)}
						</ContentHider>
						<ExpandedPostDetails post={item.value.post} isThreadAuthor={isThreadAuthor} />
						{post.repostCount !== 0 ||
						post.likeCount !== 0 ||
						post.quoteCount !== 0 ||
						post.bookmarkCount !== 0 ? (
							// Show this section unless we're *sure* it has no engagement.
							<div className={css.statsRow}>
								{post.repostCount != null && post.repostCount !== 0 ? (
									<InlineLinkText
										color="textContrastMedium"
										data-testid="repostCount-expanded"
										label={l`Reposts of this post`}
										size="md"
										to={repostsHref}
									>
										<Trans comment="Repost count display, the <0> tags enclose the number of reposts in bold (will never be 0)">
											<Text color="text" size="md" weight="semiBold">
												{formatPostStatCount(post.repostCount)}
											</Text>{' '}
											<Plural value={post.repostCount} one="repost" other="reposts" />
										</Trans>
									</InlineLinkText>
								) : null}
								{post.quoteCount != null && post.quoteCount !== 0 && !post.viewer?.embeddingDisabled ? (
									<InlineLinkText
										color="textContrastMedium"
										data-testid="quoteCount-expanded"
										label={l`Quotes of this post`}
										size="md"
										to={quotesHref}
									>
										<Trans comment="Quote count display, the <0> tags enclose the number of quotes in bold (will never be 0)">
											<Text color="text" size="md" weight="semiBold">
												{formatPostStatCount(post.quoteCount)}
											</Text>{' '}
											<Plural value={post.quoteCount} one="quote" other="quotes" />
										</Trans>
									</InlineLinkText>
								) : null}
								{post.likeCount != null && post.likeCount !== 0 ? (
									<InlineLinkText
										color="textContrastMedium"
										data-testid="likeCount-expanded"
										label={l`Likes on this post`}
										size="md"
										to={likesHref}
									>
										<Trans comment="Like count display, the <0> tags enclose the number of likes in bold (will never be 0)">
											<Text color="text" size="md" weight="semiBold">
												{formatPostStatCount(post.likeCount)}
											</Text>{' '}
											<Plural value={post.likeCount} one="like" other="likes" />
										</Trans>
									</InlineLinkText>
								) : null}
								{post.bookmarkCount != null && post.bookmarkCount !== 0 ? (
									<Text data-testid="bookmarkCount-expanded" size="md" color="textContrastMedium">
										<Trans comment="Save count display, the <0> tags enclose the number of saves in bold (will never be 0)">
											<Text color="text" size="md" weight="semiBold">
												{formatPostStatCount(post.bookmarkCount)}
											</Text>{' '}
											<Plural value={post.bookmarkCount} one="save" other="saves" />
										</Trans>
									</Text>
								) : null}
							</div>
						) : null}

						<FeedFeedbackProvider value={feedFeedback}>
							<AnchorPostControls
								post={postShadow}
								record={record}
								richText={richText}
								onPressReply={onPressReply}
								logContext="PostThreadItem"
								threadgateRecord={threadgateRecord}
								feedContext={postSource?.post?.feedContext}
								reqId={postSource?.post?.reqId}
								viaRepost={viaRepost}
							/>
						</FeedFeedbackProvider>

						<DebugFieldDisplay subject={post} />
					</div>
				</PostLayout.Frame>
			</GalleryBleed>
		</>
	);
});

function ExpandedPostDetails({
	post,
	isThreadAuthor,
}: {
	post: Extract<ThreadItem, { type: 'threadPost' }>['value']['post'];
	isThreadAuthor: boolean;
}) {
	const { i18n } = useLingui();
	const isRootPost = !('reply' in post.record);

	return (
		<div className={css.expandedDetails}>
			<BackdatedPostIndicator post={post} />
			<div className={css.expandedDetailsRow}>
				<Text size="md_sub" color="textContrastMedium">
					{niceDate(i18n, post.indexedAt, 'dot separated')}
				</Text>
				{isRootPost && <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />}
			</div>
		</div>
	);
}

function BackdatedPostIndicator({ post }: { post: AppBskyFeedDefs.PostView }) {
	const { t: l, i18n } = useLingui();
	const control = Prompt.usePromptControl();

	const indexedAt = new Date(post.indexedAt);
	const createdAt = new Date((post.record as AppBskyFeedPost.Main).createdAt);

	// backdated if createdAt is 24 hours or more before indexedAt
	const isBackdated = indexedAt.getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000;

	if (!isBackdated) return null;

	return (
		<>
			<Button
				label={l`Archived post`}
				accessibilityHint={l`Shows information about when this post was created`}
				onPress={(e) => {
					e.preventDefault();
					e.stopPropagation();
					control.open();
				}}
			>
				{({ hovered, pressed }) => (
					<div className={clsx(css.archivedPill, (hovered || pressed) && css.archivedPillActive)}>
						<CalendarClockIcon fill={colors.yellow} size="sm" aria-hidden />
						<Text size="xs" weight="semiBold" color="textContrastMedium">
							<Trans>Archived from {niceDate(i18n, createdAt, 'medium')}</Trans>
						</Text>
					</div>
				)}
			</Button>

			<Prompt.Outer control={control}>
				<Prompt.Content>
					<Prompt.TitleText>
						<Trans>Archived post</Trans>
					</Prompt.TitleText>
					<Prompt.DescriptionText>
						<Trans>
							This post claims to have been created on{' '}
							<Text weight="semiBold">{niceDate(i18n, createdAt)}</Text>, but was first seen by Bluesky on{' '}
							<Text weight="semiBold">{niceDate(i18n, indexedAt)}</Text>.
						</Trans>
					</Prompt.DescriptionText>
					<Prompt.DescriptionText>
						<Trans>Bluesky cannot confirm the authenticity of the claimed date.</Trans>
					</Prompt.DescriptionText>
				</Prompt.Content>
				<Prompt.Actions>
					<Prompt.Action cta={l`Okay`} onPress={() => {}} />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}

function getThreadAuthor(post: AppBskyFeedDefs.PostView, record: AppBskyFeedPost.Main): string {
	if (!record.reply) {
		return post.author.did;
	}
	try {
		return parseCanonicalResourceUri(record.reply.root.uri).repo;
	} catch {
		return '';
	}
}

export function ThreadItemAnchorSkeleton() {
	// rebuilt on the real anchor layout: a `Frame` with the avatar/name row, a `lg` body (the live `RichText`
	// renders `lg`, not `xl`), the bordered stats row, and the big anchor controls.
	return (
		<PostLayout.Frame rootPad>
			<div className={css.avatarRow}>
				<Skele.Circle size={42} />
				<div className={css.header}>
					<div className={css.nameRow}>
						<Skele.Text size="lg" width="45%" />
					</div>
					<Skele.Text blend size="md" width="60%" />
				</div>
			</div>

			<div className={css.body}>
				<Skele.Text blend size="lg" width="100%" />
				<Skele.Text blend size="lg" width="100%" />
				<Skele.Text blend size="lg" width="70%" />
			</div>

			<div className={css.statsRow}>
				<Skele.Text size="md" width={120} />
			</div>

			<AnchorPostControlsSkeleton />
		</PostLayout.Frame>
	);
}
