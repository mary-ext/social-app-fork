import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { buildPostSourceKey, setUnstablePostSource } from '#/state/unstable-post-source';

import { PostMeta } from '#/view/com/util/PostMeta';

import { BlockLink } from '#/components/BlockLink';
import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import type { AppModerationCause } from '#/components/Pills';
import { PostRepliedTo } from '#/components/Post/PostRepliedTo';
import { PostContent } from '#/components/PostContent';
import { PostControls } from '#/components/PostControls';
import { DiscoverDebug } from '#/components/PostControls/DiscoverDebug';
import { PostOverflowMenuButton } from '#/components/PostControls/PostOverflowMenuButton';
import * as PostLayout from '#/components/PostLayout';
import { PreviewableUserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow';

import * as css from './PostFeedItem.css';
import { PostFeedReason } from './PostFeedReason';

interface FeedItemProps {
	record: AppBskyFeedPost.Main;
	reason: AppBskyFeedDefs.ReasonRepost | AppBskyFeedDefs.ReasonPin | undefined;
	moderation: ModerationDecision;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	showReplyTo: boolean;
	isThreadChild?: boolean;
	isThreadParent?: boolean;
	feedContext: string | undefined;
	reqId: string | undefined;
	hideTopBorder?: boolean;
	isParentBlocked?: boolean;
	isParentNotFound?: boolean;
}

export function PostFeedItem({
	post,
	record,
	reason,
	feedContext,
	reqId,
	moderation,
	parentAuthor,
	showReplyTo,
	isThreadChild,
	isThreadParent,
	hideTopBorder,
	isParentBlocked,
	isParentNotFound,
	rootPost,
	onShowLess,
}: FeedItemProps & {
	post: AppBskyFeedDefs.PostView;
	rootPost: AppBskyFeedDefs.PostView;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
}): React.ReactNode {
	const postShadowed = usePostShadow(post);
	const richText: Richtext = {
		text: record.text,
		facets: record.facets,
	};
	if (postShadowed === POST_TOMBSTONE) {
		return null;
	}
	if (richText && moderation) {
		return (
			<FeedItemInner
				// Safeguard from clobbering per-post state below:
				key={postShadowed.uri}
				post={postShadowed}
				record={record}
				reason={reason}
				feedContext={feedContext}
				reqId={reqId}
				richText={richText}
				parentAuthor={parentAuthor}
				showReplyTo={showReplyTo}
				moderation={moderation}
				isThreadChild={isThreadChild}
				isThreadParent={isThreadParent}
				hideTopBorder={hideTopBorder}
				isParentBlocked={isParentBlocked}
				isParentNotFound={isParentNotFound}
				rootPost={rootPost}
				onShowLess={onShowLess}
			/>
		);
	}
	return null;
}

function FeedItemInner({
	post,
	record,
	reason,
	feedContext,
	reqId,
	richText,
	moderation,
	parentAuthor,
	showReplyTo,
	isThreadChild,
	isThreadParent,
	hideTopBorder,
	isParentBlocked,
	isParentNotFound,
	rootPost,
	onShowLess,
}: FeedItemProps & {
	richText: Richtext;
	post: Shadow<AppBskyFeedDefs.PostView>;
	rootPost: AppBskyFeedDefs.PostView;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
}): React.ReactNode {
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const { currentAccount } = useSession();

	const urip = parseCanonicalResourceUri(post.uri);
	const href = makeProfileLink(post.author, 'post', urip.rkey);
	const { sendInteraction, feedSourceInfo } = useFeedFeedbackContext();

	const onPressReply = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#interactionReply',
			feedContext,
			reqId,
		});
		openComposer({
			replyTo: {
				uri: post.uri,
				cid: post.cid,
				text: record.text || '',
				author: post.author,
				embed: post.embed,
				moderation,
				langs: record.langs,
			},
		});
	};

	const onOpenAuthor = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#clickthroughAuthor',
			feedContext,
			reqId,
		});
	};

	const onOpenReposter = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#clickthroughReposter',
			feedContext,
			reqId,
		});
	};

	const onOpenEmbed = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#clickthroughEmbed',
			feedContext,
			reqId,
		});
	};

	const onBeforePress = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#clickthroughItem',
			feedContext,
			reqId,
		});
		unstableCacheProfileView(queryClient, post.author);
		setUnstablePostSource(buildPostSourceKey(post.uri, post.author.handle), {
			feedSourceInfo,
			post: {
				post,
				reason: (reason?.$type === 'app.bsky.feed.defs#reasonRepost'
					? reason
					: undefined) as AppBskyFeedDefs.FeedViewPost['reason'],
				feedContext,
				reqId,
			},
		});
	};

	/**
	 * If `post[0]` in this slice is the actual root post (not an orphan thread), then we may have a threadgate
	 * record to reference
	 */
	const threadgateRecord = rootPost.threadgate
		? (rootPost.threadgate.record as AppBskyFeedThreadgate.Main)
		: undefined;

	const { isActive: live } = useActorStatus(post.author);

	let viaRepost: { uri: string; cid: string } | undefined;
	if (reason?.$type === 'app.bsky.feed.defs#reasonRepost' && reason.uri && reason.cid) {
		viaRepost = {
			uri: reason.uri,
			cid: reason.cid,
		};
	}

	const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
		threadgateRecord,
	});
	let additionalPostAlerts: AppModerationCause[] = [];
	{
		const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
		const rootPostUri = (post.record as AppBskyFeedPost.Main).reply?.root?.uri || post.uri;
		const isControlledByViewer =
			rootPostUri && parseCanonicalResourceUri(rootPostUri).repo === currentAccount?.did;
		if (isControlledByViewer && isPostHiddenByThreadgate) {
			additionalPostAlerts = [
				{
					type: 'reply-hidden',
					source: { type: 'user', did: currentAccount?.did },
					priority: 6,
				},
			];
		}
	}

	const galleryOffsetStyles = maybeApplyGalleryOffsetStyles({
		additionalCauses: additionalPostAlerts,
		modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
		post,
	});
	return (
		<GalleryBleed>
			<BlockLink to={href} onBeforePress={onBeforePress}>
				<PostLayout.Frame hoverable topBorder={!(hideTopBorder || isThreadChild)}>
					<div className={css.reasonRow}>
						<div className={css.spineSlot}>
							{isThreadChild && <PostLayout.Spine className={css.replyLineTop} />}
						</div>
						<div className={css.reason}>
							{reason && <PostFeedReason reason={reason} onOpenReposter={onOpenReposter} />}
						</div>
					</div>

					<PostLayout.Row>
						<PostLayout.AvatarColumn>
							<PreviewableUserAvatar
								size={36}
								profile={post.author}
								moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
								type={post.author.associated?.labeler ? 'labeler' : 'user'}
								onBeforePress={onOpenAuthor}
								live={live}
								tabIndex={-1}
							/>
							{isThreadParent && (
								<PostLayout.Spine className={live ? css.replyLineParentLive : css.replyLineParent} />
							)}
						</PostLayout.AvatarColumn>
						<PostLayout.ContentColumn style={galleryOffsetStyles?.meta}>
							<div className={css.metaSpacing}>
								<PostMeta
									author={post.author}
									moderation={moderation}
									timestamp={post.indexedAt}
									postHref={href}
									onOpenAuthor={onOpenAuthor}
								/>
								<PostOverflowMenuButton
									post={post}
									record={record}
									richText={richText}
									feedContext={feedContext}
									reqId={reqId}
									threadgateRecord={threadgateRecord}
									onShowLess={onShowLess}
								/>
							</div>
							{showReplyTo && (parentAuthor || isParentBlocked || isParentNotFound) && (
								<PostRepliedTo
									parentAuthor={parentAuthor}
									isParentBlocked={isParentBlocked}
									isParentNotFound={isParentNotFound}
									className={css.repliedTo}
								/>
							)}
							<LabelsOnMyPost post={post} />
							<PostContent
								additionalCauses={additionalPostAlerts}
								displayContext="list"
								ignoreMute
								moderation={moderation}
								onOpenEmbed={onOpenEmbed}
								post={post}
								richText={richText}
								embedStyle={galleryOffsetStyles?.embed}
							/>
							<PostControls
								post={post}
								onPressReply={onPressReply}
								feedContext={feedContext}
								reqId={reqId}
								viaRepost={viaRepost}
							/>
						</PostLayout.ContentColumn>

						<DiscoverDebug feedContext={feedContext} />
					</PostLayout.Row>
				</PostLayout.Frame>
			</BlockLink>
		</GalleryBleed>
	);
}
