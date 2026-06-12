import { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import type { ThreadItem } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';

import { PostMeta } from '#/view/com/util/PostMeta';

import { OUTER_SPACE, TREE_AVI_WIDTH } from '#/screens/PostThread/const';

import { atoms as a, useTheme } from '#/alf';

import { ClampedPostText } from '#/components/ClampedPostText';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { GalleryBleed } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { PostHider } from '#/components/moderation/PostHider';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Text';

import * as css from './ThreadItemTreePost.css';

export function ThreadItemTreePost({
	item,
	overrides,
	onPostSuccess,
	threadgateRecord,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	overrides?: {
		moderation?: boolean;
		topBorder?: boolean;
	};
	onPostSuccess?: (data: OnPostSuccessData) => void;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
}) {
	const postShadow = usePostShadow(item.value.post);

	if (postShadow === POST_TOMBSTONE) {
		return <ThreadItemTreePostDeleted item={item} />;
	}

	return (
		<ThreadItemTreePostInner
			// Safeguard from clobbering per-post state below:
			key={postShadow.uri}
			item={item}
			postShadow={postShadow}
			threadgateRecord={threadgateRecord}
			overrides={overrides}
			onPostSuccess={onPostSuccess}
		/>
	);
}

function ThreadItemTreePostDeleted({ item }: { item: Extract<ThreadItem, { type: 'threadPost' }> }) {
	return (
		<ThreadItemTreePostOuterWrapper item={item}>
			<ThreadItemTreePostInnerWrapper item={item}>
				<div className={css.deletedRow}>
					<TrashIcon fill="currentColor" width={14} />
					<Text color="textContrastMedium" className={css.deletedText}>
						<Trans>Post has been deleted</Trans>
					</Text>
				</div>
				{item.ui.isLastChild && !item.ui.precedesChildReadMore && <div className={css.deletedSpacer} />}
			</ThreadItemTreePostInnerWrapper>
		</ThreadItemTreePostOuterWrapper>
	);
}

const ThreadItemTreePostOuterWrapper = memo(function ThreadItemTreePostOuterWrapper({
	item,
	children,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	children: React.ReactNode;
}) {
	const indents = Math.max(0, item.ui.indent - 1);

	return (
		<GalleryBleed>
			<div
				className={clsx(
					css.outerRow,
					item.ui.indent === 1 && !item.ui.showParentReplyLine && css.outerRowBorder,
				)}
			>
				{Array.from(Array(indents)).map((_, n: number) => {
					const isSkipped = item.ui.skippedIndentIndices.has(n);
					return (
						<div
							key={`${item.value.post.uri}-padding-${n}`}
							className={clsx(css.guide, isSkipped && css.guideSkipped)}
						/>
					);
				})}
				{children}
			</div>
		</GalleryBleed>
	);
});

const ThreadItemTreePostInnerWrapper = memo(function ThreadItemTreePostInnerWrapper({
	item,
	children,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	children: React.ReactNode;
}) {
	return (
		<div
			className={clsx(
				css.innerWrapper,
				item.ui.indent === 1 && !item.ui.showParentReplyLine
					? css.innerWrapperPadTopLoose
					: css.innerWrapperPadTop,
				((item.ui.indent === 1 && !item.ui.showChildReplyLine) ||
					(item.ui.isLastChild && !item.ui.precedesChildReadMore)) &&
					css.innerWrapperPadBottom,
			)}
		>
			{item.ui.indent > 1 && <div className={css.connector} />}
			{children}
		</div>
	);
});

const ThreadItemTreeReplyChildReplyLine = memo(function ThreadItemTreeReplyChildReplyLine({
	item,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
}) {
	return (
		<div className={css.replyChildLineColumn}>
			{item.ui.showChildReplyLine && <div className={css.replyChildLine} />}
		</div>
	);
});

const ThreadItemTreePostInner = memo(function ThreadItemTreePostInner({
	item,
	postShadow,
	overrides,
	onPostSuccess,
	threadgateRecord,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	postShadow: Shadow<AppBskyFeedDefs.PostView>;
	overrides?: {
		moderation?: boolean;
		topBorder?: boolean;
	};
	onPostSuccess?: (data: OnPostSuccessData) => void;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
}): React.ReactNode {
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

	return (
		<ThreadItemTreePostOuterWrapper item={item}>
			<div className={css.hoverable}>
				<PostHider
					href={postHref}
					disabled={overrides?.moderation === true}
					modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
					iconSize={42}
					iconClassName={css.hiderIcon}
					profile={post.author}
					interpretFilterAsBlur
				>
					<ThreadItemTreePostInnerWrapper item={item}>
						<div className={css.bodyColumn}>
							<PostMeta
								author={post.author}
								moderation={moderation}
								timestamp={post.indexedAt}
								postHref={postHref}
								avatarSize={TREE_AVI_WIDTH}
								showAvatar
							/>
							<div className={css.bodyRow}>
								<ThreadItemTreeReplyChildReplyLine item={item} />
								<div className={css.contentColumn}>
									<LabelsOnMyPost className={css.labelsOnMe} post={post} />
									<PostAlerts
										additionalCauses={additionalPostAlerts}
										className={css.postAlerts}
										modui={getDisplayRestrictions(moderation, DisplayContext.ContentList)}
									/>
									{richText?.text ? (
										<ClampedPostText authorHandle={post.author.handle} richText={richText} />
									) : null}
									{post.embed && (
										<div className={css.embed}>
											<Embed
												embed={post.embed}
												moderation={moderation}
												viewContext={PostEmbedViewContext.Feed}
											/>
										</div>
									)}
									<PostControls
										variant="compact"
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
						</div>
					</ThreadItemTreePostInnerWrapper>
				</PostHider>
			</div>
		</ThreadItemTreePostOuterWrapper>
	);
});

export function ThreadItemTreePostSkeleton({ index }: { index: number }) {
	const t = useTheme();
	const even = index % 2 === 0;
	return (
		<View
			style={[
				{ paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5 },
				a.border_t,
				t.atoms.border_contrast_low,
			]}
		>
			<Skele.Row style={[a.align_start, a.gap_xs]}>
				<Skele.Circle size={TREE_AVI_WIDTH} />

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
