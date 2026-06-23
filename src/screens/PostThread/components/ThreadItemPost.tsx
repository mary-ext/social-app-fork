import { memo, type ReactNode, useCallback, useMemo } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans } from '@lingui/react/macro';

import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import type { ThreadItem } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';

import { PostMeta } from '#/view/com/util/PostMeta';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { ClampedPostText } from '#/components/ClampedPostText';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { PostHider } from '#/components/moderation/PostHider';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import * as PostLayout from '#/components/PostLayout';
import { Text } from '#/components/Text';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import * as Skele from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow';

import * as css from './ThreadItemPost.css';

export type ThreadItemPostProps = {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	overrides?: {
		moderation?: boolean;
		topBorder?: boolean;
	};
	onPostSuccess?: (data: OnPostSuccessData) => void;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
};

export function ThreadItemPost({ item, overrides, onPostSuccess, threadgateRecord }: ThreadItemPostProps) {
	const postShadow = usePostShadow(item.value.post);

	if (postShadow === POST_TOMBSTONE) {
		return <ThreadItemPostDeleted item={item} overrides={overrides} />;
	}

	return (
		<ThreadItemPostInner
			item={item}
			postShadow={postShadow}
			threadgateRecord={threadgateRecord}
			overrides={overrides}
			onPostSuccess={onPostSuccess}
		/>
	);
}

function ThreadItemPostDeleted({ item, overrides }: Pick<ThreadItemPostProps, 'item' | 'overrides'>) {
	return (
		<ThreadItemPostOuterWrapper item={item} overrides={overrides}>
			<ThreadItemPostParentReplyLine item={item} />

			<div className={css.deletedRow}>
				<div className={css.deletedIcon}>
					<TrashIcon fill="currentColor" />
				</div>
				<Text size="md" weight="semiBold" color="textContrastMedium">
					<Trans>Post has been deleted</Trans>
				</Text>
			</div>

			<div className={css.deletedSpacer} />
		</ThreadItemPostOuterWrapper>
	);
}

const ThreadItemPostOuterWrapper = memo(function ThreadItemPostOuterWrapper({
	item,
	overrides,
	hoverable,
	children,
}: Pick<ThreadItemPostProps, 'item' | 'overrides'> & {
	hoverable?: boolean;
	children: ReactNode;
}) {
	const showTopBorder = !item.ui.showParentReplyLine && overrides?.topBorder !== true;

	return (
		<GalleryBleed>
			<PostLayout.Frame hoverable={hoverable} topBorder={showTopBorder}>
				{children}
			</PostLayout.Frame>
		</GalleryBleed>
	);
});

/** Provides some space between posts as well as contains the reply line */
const ThreadItemPostParentReplyLine = memo(function ThreadItemPostParentReplyLine({
	item,
}: Pick<ThreadItemPostProps, 'item'>) {
	return (
		<div className={css.parentLineRow}>
			<div className={css.parentLineColumn}>
				{item.ui.showParentReplyLine && <PostLayout.Spine className={css.parentLine} />}
			</div>
		</div>
	);
});

const ThreadItemPostInner = memo(function ThreadItemPostInner({
	item,
	postShadow,
	overrides,
	onPostSuccess,
	threadgateRecord,
}: ThreadItemPostProps & {
	postShadow: Shadow<AppBskyFeedDefs.PostView>;
}) {
	const { openComposer } = useOpenComposer();
	const { currentAccount } = useSession();

	const post = item.value.post;
	const record = item.value.post.record;
	const moderation = item.moderation;
	const richText: Richtext = useMemo(
		() => ({
			text: record.text,
			facets: record.facets,
		}),
		[record],
	);
	const threadRootUri = record.reply?.root?.uri || post.uri;
	const postHref = useMemo(() => {
		const urip = parseCanonicalResourceUri(post.uri);
		return makeProfileLink(post.author, 'post', urip.rkey);
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

	const onPressReply = useCallback(() => {
		openComposer({
			replyTo: {
				uri: post.uri,
				cid: post.cid,
				text: record.text,
				author: post.author,
				embed: post.embed,
				moderation,
				langs: post.record.langs,
			},
			onPostSuccess: onPostSuccess,
			logContext: 'PostReply',
		});
	}, [openComposer, post, record, onPostSuccess, moderation]);

	const { isActive: live } = useActorStatus(post.author);

	return (
		<ThreadItemPostOuterWrapper item={item} overrides={overrides} hoverable>
			<PostHider
				to={postHref}
				disabled={overrides?.moderation === true}
				modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
				hiderClassName={css.hider}
				iconSize={LINEAR_AVI_WIDTH}
				iconClassName={css.hiderIcon}
				profile={post.author}
				interpretFilterAsBlur
			>
				<ThreadItemPostParentReplyLine item={item} />

				<PostLayout.Row>
					<PostLayout.AvatarColumn>
						<PreviewableUserAvatar
							size={LINEAR_AVI_WIDTH}
							profile={post.author}
							moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
							type={post.author.associated?.labeler ? 'labeler' : 'user'}
							live={live}
						/>

						{(item.ui.showChildReplyLine || item.ui.precedesChildReadMore) && (
							<PostLayout.Spine className={css.childLine} />
						)}
					</PostLayout.AvatarColumn>

					<PostLayout.ContentColumn>
						<div
							className={css.metaSpacing}
							style={maybeApplyGalleryOffsetStyles('meta', {
								post: post,
								modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
								additionalCauses: additionalPostAlerts,
							})}
						>
							<PostMeta
								author={post.author}
								moderation={moderation}
								timestamp={post.indexedAt}
								postHref={postHref}
							/>
						</div>
						<LabelsOnMyPost className={css.labelsOnMe} post={post} />
						<PostAlerts
							additionalCauses={additionalPostAlerts}
							className={css.postAlerts}
							modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
						/>
						{richText?.text ? (
							<ClampedPostText authorHandle={post.author.handle} richText={richText} />
						) : undefined}
						{post.embed && (
							<div
								className={css.embed}
								style={maybeApplyGalleryOffsetStyles('embed', {
									post: post,
									modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
									additionalCauses: additionalPostAlerts,
								})}
							>
								<Embed embed={post.embed} moderation={moderation} viewContext={PostEmbedViewContext.Feed} />
							</div>
						)}
						<PostControls
							post={postShadow}
							record={record}
							richText={richText}
							onPressReply={onPressReply}
							logContext="PostThreadItem"
							threadgateRecord={threadgateRecord}
						/>
						<DebugFieldDisplay subject={post} />
					</PostLayout.ContentColumn>
				</PostLayout.Row>
			</PostHider>
		</ThreadItemPostOuterWrapper>
	);
});

// per-index last-line widths; these skeletons render per item without a freezing memo, so a deterministic
// pick keeps each row stable across re-renders (a `Math.random` would reshuffle and flicker).
const LAST_LINE_WIDTHS = [55, 70, 45, 85, 60];

export function ThreadItemPostSkeleton({ index }: { index: number }) {
	const lineCount = 1 + (index % 3);
	const lastWidth = LAST_LINE_WIDTHS[index % LAST_LINE_WIDTHS.length] ?? 60;
	// rebuilt on the real linear layout (`PostLayout` row + content column), so spacing tracks the live post.
	// the live item always carries the empty `parentLineRow` spacer above the avatar, so mirror it here too.
	return (
		<PostLayout.Frame topBorder>
			<div className={css.parentLineRow} />
			<PostLayout.Row>
				<PostLayout.AvatarColumn>
					<Skele.Circle size={LINEAR_AVI_WIDTH} />
				</PostLayout.AvatarColumn>
				<PostLayout.ContentColumn>
					<div className={css.metaSpacing}>
						<Skele.Text size="md" width="25%" />
					</div>
					<Skele.Col>
						{Array.from({ length: lineCount }, (_, i) => (
							<Skele.Text key={i} blend size="md" width={i === lineCount - 1 ? `${lastWidth}%` : '100%'} />
						))}
					</Skele.Col>
					<PostControlsSkeleton />
				</PostLayout.ContentColumn>
			</PostLayout.Row>
		</PostLayout.Frame>
	);
}
