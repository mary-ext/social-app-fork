import { memo, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyFeedThreadgate,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import type { ReasonFeedSource } from '#/lib/api/feed/types';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { buildPostSourceKey, setUnstablePostSource } from '#/state/unstable-post-source';

import { PostMeta } from '#/view/com/util/PostMeta';

import { select, useTheme } from '#/alf';

import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import type { AppModerationCause } from '#/components/Pills';
import { PostRepliedTo } from '#/components/Post/PostRepliedTo';
import { PostControls } from '#/components/PostControls';
import { DiscoverDebug } from '#/components/PostControls/DiscoverDebug';
import { SubtleHover } from '#/components/SubtleHover';
import { BlockLink } from '#/components/web/BlockLink';
import { PostContent } from '#/components/web/PostContent';
import * as PostRow from '#/components/web/PostRow';
import * as postRowCss from '#/components/web/PostRow.css';
import { PreviewableUserAvatar } from '#/components/web/UserAvatar';

import { useActorStatus } from '#/features/liveNow';

import * as css from './PostFeedItem.css';
import { PostFeedReason } from './PostFeedReason';

interface FeedItemProps {
	record: AppBskyFeedPost.Main;
	reason: AppBskyFeedDefs.ReasonRepost | AppBskyFeedDefs.ReasonPin | ReasonFeedSource | undefined;
	moderation: ModerationDecision;
	parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined;
	showReplyTo: boolean;
	isThreadChild?: boolean;
	isThreadLastChild?: boolean;
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
	isThreadLastChild,
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
	const richText = useMemo(
		(): Richtext => ({
			text: record.text,
			facets: record.facets,
		}),
		[record],
	);
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
				isThreadLastChild={isThreadLastChild}
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

let FeedItemInner = ({
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
	isThreadLastChild,
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
}): React.ReactNode => {
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const pal = usePalette('default');
	const t = useTheme();
	const { currentAccount } = useSession();

	const [hover, setHover] = useState(false);

	const [href] = useMemo(() => {
		const urip = parseCanonicalResourceUri(post.uri);
		return [makeProfileLink(post.author, 'post', urip.rkey), urip.rkey];
	}, [post.uri, post.author]);
	const { sendInteraction, feedSourceInfo, feedDescriptor: _feedDescriptor } = useFeedFeedbackContext();

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
			logContext: 'PostReply',
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

	const outerStyles = [
		styles.outer,
		{
			borderColor: pal.colors.border,
			borderTopWidth: hideTopBorder || isThreadChild ? 0 : StyleSheet.hairlineWidth,
			paddingBottom: isThreadLastChild || (!isThreadChild && !isThreadParent) ? 8 : undefined,
			// the feed's first post hides its top border (the sticky header already separates
			// it), so reclaim the removed hairline as padding to keep content from shifting up 1px
			paddingTop: hideTopBorder ? StyleSheet.hairlineWidth : undefined,
		},
	];

	/**
	 * If `post[0]` in this slice is the actual root post (not an orphan thread), then we may have a threadgate
	 * record to reference
	 */
	const threadgateRecord = rootPost.threadgate
		? (rootPost.threadgate.record as AppBskyFeedThreadgate.Main)
		: undefined;

	const { isActive: live } = useActorStatus(post.author);

	const viaRepost = useMemo(() => {
		if (reason?.$type === 'app.bsky.feed.defs#reasonRepost' && reason.uri && reason.cid) {
			return {
				uri: reason.uri,
				cid: reason.cid,
			};
		}
	}, [reason]);

	const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
		threadgateRecord,
	});
	const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
		const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
		const rootPostUri = (post.record as AppBskyFeedPost.Main).reply?.root?.uri || post.uri;
		const isControlledByViewer =
			rootPostUri && parseCanonicalResourceUri(rootPostUri).repo === currentAccount?.did;
		return isControlledByViewer && isPostHiddenByThreadgate
			? [
					{
						type: 'reply-hidden',
						source: { type: 'user', did: currentAccount?.did },
						priority: 6,
					},
				]
			: [];
	}, [post, currentAccount?.did, threadgateHiddenReplies]);

	const spineColor = select(t.name, {
		light: t.palette.contrast_100,
		dim: t.palette.contrast_200,
		dark: t.palette.contrast_200,
	});

	return (
		<GalleryBleed>
			<BlockLink
				testID={`feedItem-by-${post.author.handle}`}
				style={outerStyles}
				href={href}
				onBeforePress={onBeforePress}
				onPointerEnter={() => {
					setHover(true);
				}}
				onPointerLeave={() => {
					setHover(false);
				}}
			>
				<SubtleHover hover={hover} />
				<div className={css.reasonRow}>
					<div className={css.spineSlot}>
						{isThreadChild && (
							<div
								className={clsx(css.replyLine, css.replyLineTop)}
								style={{ backgroundColor: spineColor }}
							/>
						)}
					</div>
					<div className={css.reason}>
						{reason && (
							<PostFeedReason reason={reason} moderation={moderation} onOpenReposter={onOpenReposter} />
						)}
					</div>
				</div>

				<PostRow.Row className={css.layoutRow}>
					<PostRow.AvatarColumn>
						<PreviewableUserAvatar
							size={42}
							profile={post.author}
							moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
							type={post.author.associated?.labeler ? 'labeler' : 'user'}
							onBeforePress={onOpenAuthor}
							live={live}
						/>
						{isThreadParent && (
							<div
								className={css.replyLine}
								style={{ backgroundColor: spineColor, marginTop: live ? 8 : 4 }}
							/>
						)}
					</PostRow.AvatarColumn>
					<PostRow.Content
						style={maybeApplyGalleryOffsetStyles('meta', {
							post,
							modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
							additionalCauses: additionalPostAlerts,
						})}
					>
						<div className={postRowCss.metaSpacing}>
							<PostMeta
								author={post.author}
								moderation={moderation}
								timestamp={post.indexedAt}
								postHref={href}
								onOpenAuthor={onOpenAuthor}
							/>
						</div>
						{showReplyTo && (parentAuthor || isParentBlocked || isParentNotFound) && (
							<PostRepliedTo
								parentAuthor={parentAuthor}
								isParentBlocked={isParentBlocked}
								isParentNotFound={isParentNotFound}
								className={postRowCss.repliedTo}
							/>
						)}
						<LabelsOnMyPost post={post} />
						<PostContent
							additionalCauses={additionalPostAlerts}
							displayContext="list"
							embedClassName={css.embedSpacing}
							ignoreMute
							moderation={moderation}
							onOpenEmbed={onOpenEmbed}
							post={post}
							richText={richText}
						/>
						<PostControls
							post={post}
							record={record}
							richText={richText}
							onPressReply={onPressReply}
							logContext="FeedItem"
							feedContext={feedContext}
							reqId={reqId}
							threadgateRecord={threadgateRecord}
							onShowLess={onShowLess}
							viaRepost={viaRepost}
						/>
					</PostRow.Content>

					<DiscoverDebug feedContext={feedContext} />
				</PostRow.Row>
			</BlockLink>
		</GalleryBleed>
	);
};
FeedItemInner = memo(FeedItemInner);

const styles = StyleSheet.create({
	outer: {
		paddingLeft: 10,
		paddingRight: 15,
		cursor: 'pointer',
	},
});
