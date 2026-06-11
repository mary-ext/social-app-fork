import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans } from '@lingui/react/macro';

import { MAX_POST_LINES } from '#/lib/constants';
import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import { countLines } from '#/lib/strings/helpers';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import type { ThreadItem } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';

import { PostMeta } from '#/view/com/util/PostMeta';

import { LINEAR_AVI_WIDTH, OUTER_SPACE } from '#/screens/PostThread/const';

import { atoms as a, useTheme } from '#/alf';

import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import * as Skele from '#/components/Skeleton';
import { SubtleHover } from '#/components/SubtleHover';
import { PostHider } from '#/components/web/moderation/PostHider';
import { RichText } from '#/components/web/RichText';
import { Text } from '#/components/web/Text';
import { PreviewableUserAvatar } from '#/components/web/UserAvatar';

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
	children,
}: Pick<ThreadItemPostProps, 'item' | 'overrides'> & {
	children: ReactNode;
}) {
	const t = useTheme();
	const showTopBorder = !item.ui.showParentReplyLine && overrides?.topBorder !== true;

	// stays a `View`: it's the element `GalleryBleed` clones to measure (array `style` + `onLayout` + a
	// `View` ref), which a plain `<div>` can't accept. the web layout lives inside.
	return (
		<GalleryBleed>
			<View
				style={[
					showTopBorder && [a.border_t, t.atoms.border_contrast_low],
					{ paddingHorizontal: OUTER_SPACE },
					// If there's no next child, add a little padding to bottom
					!item.ui.showChildReplyLine &&
						!item.ui.precedesChildReadMore && {
							paddingBottom: OUTER_SPACE / 2,
						},
				]}
			>
				{children}
			</View>
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
				{item.ui.showParentReplyLine && <div className={css.parentLine} />}
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
	const [limitLines, setLimitLines] = useState(() => countLines(richText?.text) >= MAX_POST_LINES);
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

	const onPressShowMore = useCallback(() => {
		setLimitLines(false);
	}, [setLimitLines]);

	const { isActive: live } = useActorStatus(post.author);

	return (
		<SubtleHoverWrapper>
			<ThreadItemPostOuterWrapper item={item} overrides={overrides}>
				<PostHider
					testID={`postThreadItem-by-${post.author.handle}`}
					href={postHref}
					disabled={overrides?.moderation === true}
					modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
					hiderClassName={css.hider}
					iconSize={LINEAR_AVI_WIDTH}
					iconClassName={css.hiderIcon}
					profile={post.author}
					interpretFilterAsBlur
				>
					<ThreadItemPostParentReplyLine item={item} />

					<div className={css.row}>
						<div className={css.avatarColumn}>
							<PreviewableUserAvatar
								size={LINEAR_AVI_WIDTH}
								profile={post.author}
								moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
								type={post.author.associated?.labeler ? 'labeler' : 'user'}
								live={live}
							/>

							{(item.ui.showChildReplyLine || item.ui.precedesChildReadMore) && (
								<div className={css.childLine} />
							)}
						</div>

						<div className={css.content}>
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
								<div className={css.richText}>
									<RichText
										enableTags
										value={richText}
										size="md"
										numberOfLines={limitLines ? MAX_POST_LINES : undefined}
										authorHandle={post.author.handle}
									/>
									{limitLines && <ShowMoreTextButton style={[a.text_md]} onPress={onPressShowMore} />}
								</div>
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
						</div>
					</div>
				</PostHider>
			</ThreadItemPostOuterWrapper>
		</SubtleHoverWrapper>
	);
});

function SubtleHoverWrapper({ children }: { children: ReactNode }) {
	const { state: hover, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
	return (
		<div className={css.hoverWrapper} onPointerEnter={onHoverIn} onPointerLeave={onHoverOut}>
			<SubtleHover hover={hover} />
			{children}
		</div>
	);
}

export function ThreadItemPostSkeleton({ index }: { index: number }) {
	const even = index % 2 === 0;
	return (
		<View style={[{ paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5 }, a.gap_md]}>
			<Skele.Row style={[a.align_start, a.gap_md]}>
				<Skele.Circle size={LINEAR_AVI_WIDTH} />

				<Skele.Col style={[a.gap_xs]}>
					<Skele.Row style={[a.gap_sm]}>
						<Skele.Text style={[a.text_md, { width: '20%' }]} />
						<Skele.Text blend style={[a.text_md, { width: '30%' }]} />
					</Skele.Row>

					<Skele.Col>
						{even ? (
							<>
								<Skele.Text blend style={[a.text_md, { width: '100%' }]} />
								<Skele.Text blend style={[a.text_md, { width: '60%' }]} />
							</>
						) : (
							<Skele.Text blend style={[a.text_md, { width: '60%' }]} />
						)}
					</Skele.Col>

					<PostControlsSkeleton />
				</Skele.Col>
			</Skele.Row>
		</View>
	);
}
