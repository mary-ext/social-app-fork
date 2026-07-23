import type { ReactNode } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';
import type { AppModerationCause } from '#/lib/moderation/types';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import type { ThreadItem } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';

import { PostMeta } from '#/view/com/util/PostMeta';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { ClampedPostText } from '#/components/ClampedPostText';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { PostHider } from '#/components/moderation/PostHider';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import * as EmbedSkeleton from '#/components/Post/Embed/EmbedSkeleton';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import { PostOverflowMenuButton } from '#/components/PostControls/PostOverflowMenuButton';
import * as PostLayout from '#/components/PostLayout';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';

import { threadTextShape } from './skeleton-shape';
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
					{m['screens.postThread.post.error.deleted']()}
				</Text>
			</div>

			<div className={css.deletedSpacer} />
		</ThreadItemPostOuterWrapper>
	);
}

function ThreadItemPostOuterWrapper({
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
}

/** Provides some space between posts as well as contains the reply line */
function ThreadItemPostParentReplyLine({ item }: Pick<ThreadItemPostProps, 'item'>) {
	return (
		<div className={css.parentLineRow}>
			<div className={css.parentLineColumn}>
				{item.ui.showParentReplyLine && <PostLayout.Spine className={css.parentLine} />}
			</div>
		</div>
	);
}

function ThreadItemPostInner({
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
	const richText: Richtext = {
		text: record.text,
		facets: record.facets,
	};
	const threadRootUri = record.reply?.root?.uri || post.uri;
	const urip = parseCanonicalResourceUri(post.uri);
	const postHref = makeProfileLink(post.author, 'post', urip.rkey);
	const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
		threadgateRecord,
	});
	let additionalPostAlerts: AppModerationCause[] = [];
	{
		const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
		const isControlledByViewer = parseCanonicalResourceUri(threadRootUri).repo === currentAccount?.did;
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

	const onPressReply = () => {
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
		});
	};

	const { isActive: live } = useActorStatus(post.author);

	const galleryOffsetStyles = maybeApplyGalleryOffsetStyles({
		additionalCauses: additionalPostAlerts,
		modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
		post: post,
	});
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
						<div className={css.metaSpacing} style={galleryOffsetStyles?.meta}>
							<PostMeta
								author={post.author}
								moderation={moderation}
								timestamp={post.indexedAt}
								postHref={postHref}
							/>
							<PostOverflowMenuButton
								post={postShadow}
								record={record}
								richText={richText}
								threadgateRecord={threadgateRecord}
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
							<div style={galleryOffsetStyles?.embed}>
								<Embed embed={post.embed} moderation={moderation} viewContext={PostEmbedViewContext.Feed} />
							</div>
						)}
						<PostControls post={postShadow} onPressReply={onPressReply} />
					</PostLayout.ContentColumn>
				</PostLayout.Row>
			</PostHider>
		</ThreadItemPostOuterWrapper>
	);
}

export function ThreadItemPostSkeleton({ index }: { index: number }) {
	const { lastWidth, lineCount } = threadTextShape(index);
	const embed = EmbedSkeleton.threadShape(index);
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
					<Skele.Lines count={lineCount} lastWidth={lastWidth} size="md" />
					{embed ? <EmbedSkeleton.Reply shape={embed} /> : null}
					<PostControlsSkeleton />
				</PostLayout.ContentColumn>
			</PostLayout.Row>
		</PostLayout.Frame>
	);
}
