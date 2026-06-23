import { memo, useCallback, useMemo } from 'react';
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

import { TREE_AVI_WIDTH } from '#/screens/PostThread/const';

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
import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import * as css from './ThreadItemTreePost.css';
import { ChildReplyLine, Connector, IndentGuides } from './ThreadLines';

/** A root-level reply with no parent reply line carries the outer row border that opens its subtree. */
const showsTopBorder = (item: Extract<ThreadItem, { type: 'threadPost' }>) =>
	item.ui.indent === 1 && !item.ui.showParentReplyLine;

export function ThreadItemTreePost({
	item,
	overrides,
	onPostSuccess,
	threadgateRecord,
}: {
	item: Extract<ThreadItem, { type: 'threadPost' }>;
	overrides?: {
		moderation?: boolean;
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
			<div className={clsx(css.outerRow, showsTopBorder(item) && css.outerRowBorder)}>
				<IndentGuides
					count={indents}
					keyPrefix={item.value.post.uri}
					skipped={item.ui.skippedIndentIndices}
				/>
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
		<div className={clsx(css.innerWrapper, showsTopBorder(item) && css.innerWrapperBordered)}>
			{item.ui.indent > 1 && <Connector />}
			{children}
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
					to={postHref}
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
								<ChildReplyLine show={item.ui.showChildReplyLine} />
								<div className={clsx(css.contentColumn, item.ui.isLastChild && css.contentColumnLastChild)}>
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
										<Embed
											embed={post.embed}
											moderation={moderation}
											viewContext={PostEmbedViewContext.Feed}
										/>
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
						</div>
					</ThreadItemTreePostInnerWrapper>
				</PostHider>
			</div>
		</ThreadItemTreePostOuterWrapper>
	);
});

// per-index last-line widths; these render per item without a freezing memo, so a deterministic pick keeps
// each row stable across re-renders (a `Math.random` would reshuffle and flicker).
const LAST_LINE_WIDTHS = [55, 70, 45, 85, 60];

export function ThreadItemTreePostSkeleton({ index }: { index: number }) {
	const lineCount = 1 + (index % 3);
	const lastWidth = LAST_LINE_WIDTHS[index % LAST_LINE_WIDTHS.length] ?? 60;
	// the tree avatar is inline in the meta row (`PostMeta showAvatar`) with the body full-width below. tree
	// replies flow tight and borderless, so the skeleton is a flat 16/12 padded box rather than the real
	// item's indent-guide nesting.
	return (
		<div className={css.skeleton}>
			<Skele.Row align="center" gap="xs">
				<Skele.Circle size={TREE_AVI_WIDTH} />
				<Skele.Text size="md" width="25%" />
			</Skele.Row>
			<Skele.Col>
				{Array.from({ length: lineCount }, (_, i) => (
					<Skele.Text key={i} blend size="md" width={i === lineCount - 1 ? `${lastWidth}%` : '100%'} />
				))}
			</Skele.Col>
			<PostControlsSkeleton />
		</div>
	);
}
