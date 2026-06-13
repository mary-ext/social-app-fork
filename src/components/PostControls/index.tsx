import { memo, useMemo, useState } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { CountWheel } from '#/lib/custom-animations/CountWheel';
import { AnimatedLikeIcon } from '#/lib/custom-animations/LikeIcon';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import type { Shadow } from '#/state/cache/types';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { usePostLikeMutationQueue, usePostRepostMutationQueue } from '#/state/queries/post';
import { useRequireAuth } from '#/state/session';

import { useBreakpoints, useTheme } from '#/alf';

import { Reply as Bubble } from '#/components/icons/Reply';
import { useFormatPostStatCount } from '#/components/PostControls/util';
import * as Skele from '#/components/Skeleton';
import * as Toast from '#/components/Toast';

import { BookmarkButton } from './BookmarkButton';
import * as css from './index.css';
import { PostControlButton, PostControlButtonIcon, PostControlButtonText } from './PostControlButton';
import { PostMenuButton } from './PostMenu';
import { RepostButton } from './RepostButton';
import { ShareMenuButton } from './ShareMenu';

let PostControls = ({
	big,
	post,
	record,
	richText,
	feedContext,
	reqId,
	onPressReply,
	onPostReply,
	logContext,
	threadgateRecord,
	onShowLess,
	viaRepost,
	variant,
}: {
	big?: boolean;
	post: Shadow<AppBskyFeedDefs.PostView>;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	feedContext?: string | undefined;
	reqId?: string | undefined;
	onPressReply: () => void;
	onPostReply?: (postUri: string | undefined) => void;
	logContext: 'FeedItem' | 'PostThreadItem' | 'Post';
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
	viaRepost?: { uri: string; cid: string };
	variant?: 'compact' | 'normal' | 'large';
}): React.ReactNode => {
	const t = useTheme();
	const { t: l } = useLingui();
	const { openComposer } = useOpenComposer();
	const { feedDescriptor } = useFeedFeedbackContext();
	const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, viaRepost, feedDescriptor, logContext);
	const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
		post,
		viaRepost,
		feedDescriptor,
		logContext,
	);
	const requireAuth = useRequireAuth();
	const { sendInteraction } = useFeedFeedbackContext();
	const isBlocked = Boolean(
		post.author.viewer?.blocking || post.author.viewer?.blockedBy || post.author.viewer?.blockingByList,
	);
	const replyDisabled = post.viewer?.replyDisabled;
	const { gtPhone } = useBreakpoints();
	const formatPostStatCount = useFormatPostStatCount();

	const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] = useState(false);

	const onPressToggleLike = async () => {
		if (isBlocked) {
			Toast.show(l`Cannot interact with a blocked user`, {
				type: 'warning',
			});
			return;
		}

		try {
			setHasLikeIconBeenToggled(true);
			if (!post.viewer?.like) {
				sendInteraction({
					item: post.uri,
					event: 'app.bsky.feed.defs#interactionLike',
					feedContext,
					reqId,
				});
				await queueLike();
			} else {
				await queueUnlike();
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				throw e;
			}
		}
	};

	const onRepost = async () => {
		if (isBlocked) {
			Toast.show(l`Cannot interact with a blocked user`, {
				type: 'warning',
			});
			return;
		}

		try {
			if (!post.viewer?.repost) {
				sendInteraction({
					item: post.uri,
					event: 'app.bsky.feed.defs#interactionRepost',
					feedContext,
					reqId,
				});
				await queueRepost();
			} else {
				await queueUnrepost();
			}
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				throw e;
			}
		}
	};

	const onQuote = () => {
		if (isBlocked) {
			Toast.show(l`Cannot interact with a blocked user`, {
				type: 'warning',
			});
			return;
		}

		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#interactionQuote',
			feedContext,
			reqId,
		});
		openComposer({
			quote: post,
			onPost: onPostReply,
			logContext: 'QuotePost',
		});
	};

	const onShare = () => {
		sendInteraction({
			item: post.uri,
			event: 'app.bsky.feed.defs#interactionShare',
			feedContext,
			reqId,
		});
	};

	const secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
		variant,
		big,
		gtPhone,
	});

	return (
		<div className={clsx(css.outer, !big && css.outerPad)}>
			<div className={css.primaryGroup}>
				<div
					className={clsx(
						css.primaryItem,
						big ? css.replyOffsetBig : css.replyOffset,
						replyDisabled && css.replyDisabled,
					)}
				>
					<PostControlButton
						onClick={
							!replyDisabled
								? () =>
										requireAuth(() => {
											onPressReply();
										})
								: undefined
						}
						label={l({
							message: `Reply (${plural(post.replyCount || 0, {
								one: '# reply',
								other: '# replies',
							})})`,
							comment:
								'Accessibility label for the reply button, verb form followed by number of replies and noun form',
						})}
						big={big}
					>
						<PostControlButtonIcon icon={Bubble} />
						{typeof post.replyCount !== 'undefined' && post.replyCount > 0 && (
							<PostControlButtonText>{formatPostStatCount(post.replyCount)}</PostControlButtonText>
						)}
					</PostControlButton>
				</div>
				<div className={css.primaryItem}>
					<RepostButton
						isReposted={!!post.viewer?.repost}
						repostCount={(post.repostCount ?? 0) + (post.quoteCount ?? 0)}
						onRepost={() => void onRepost()}
						onQuote={onQuote}
						big={big}
						embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
					/>
				</div>
				<div className={css.primaryItem}>
					<PostControlButton
						big={big}
						active={Boolean(post.viewer?.like)}
						activeColor={t.palette.pink}
						onClick={() => requireAuth(() => onPressToggleLike())}
						label={
							post.viewer?.like
								? l({
										message: `Unlike (${plural(post.likeCount || 0, {
											one: '# like',
											other: '# likes',
										})})`,
										comment:
											'Accessibility label for the like button when the post has been liked, verb followed by number of likes and noun',
									})
								: l({
										message: `Like (${plural(post.likeCount || 0, {
											one: '# like',
											other: '# likes',
										})})`,
										comment:
											'Accessibility label for the like button when the post has not been liked, verb form followed by number of likes and noun form',
									})
						}
					>
						<AnimatedLikeIcon
							isLiked={Boolean(post.viewer?.like)}
							big={big}
							hasBeenToggled={hasLikeIconBeenToggled}
						/>
						<CountWheel
							count={post.likeCount ?? 0}
							isToggled={Boolean(post.viewer?.like)}
							hasBeenToggled={hasLikeIconBeenToggled}
							renderCount={({ count }) => (
								<PostControlButtonText>{formatPostStatCount(count)}</PostControlButtonText>
							)}
						/>
					</PostControlButton>
				</div>
			</div>
			<div className={css.secondaryGroup} style={secondaryControlSpacingStyles}>
				<BookmarkButton post={post} big={big} logContext={logContext} />
				<ShareMenuButton post={post} big={big} onShare={onShare} />
				<PostMenuButton
					post={post}
					postFeedContext={feedContext}
					postReqId={reqId}
					big={big}
					record={record}
					richText={richText}
					threadgateRecord={threadgateRecord}
					onShowLess={onShowLess}
					logContext={logContext}
				/>
			</div>
		</div>
	);
};
PostControls = memo(PostControls);
export { PostControls };

export function PostControlsSkeleton({
	big,
	variant,
}: {
	big?: boolean;
	variant?: 'compact' | 'normal' | 'large';
}) {
	const { gtPhone } = useBreakpoints();

	const rowHeight = big ? 32 : 28;
	const padding = 4;
	const size = rowHeight - padding * 2;

	const secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
		variant,
		big,
		gtPhone,
	});

	return (
		<div className={css.outer}>
			<div className={css.primaryGroup}>
				<div className={css.primaryItem} style={{ marginLeft: -padding, padding }}>
					<Skele.Pill blend size={size} />
				</div>
				<div className={css.primaryItem} style={{ padding }}>
					<Skele.Pill blend size={size} />
				</div>
				<div className={css.primaryItem} style={{ padding }}>
					<Skele.Pill blend size={size} />
				</div>
			</div>
			<div className={css.secondaryGroup} style={secondaryControlSpacingStyles}>
				<div style={{ padding }}>
					<Skele.Circle blend size={size} />
				</div>
				<div style={{ padding }}>
					<Skele.Circle blend size={size} />
				</div>
				<div style={{ padding }}>
					<Skele.Circle blend size={size} />
				</div>
			</div>
		</div>
	);
}

function useSecondaryControlSpacingStyles({
	variant,
	big,
	gtPhone,
}: {
	variant?: 'compact' | 'normal' | 'large';
	big?: boolean;
	gtPhone: boolean;
}) {
	return useMemo(() => {
		let gap = 0; // default, we want `gap` to be defined on the resulting object
		if (variant !== 'compact') gap = 4;
		if (big || gtPhone) gap = 8;
		return { gap };
	}, [variant, big, gtPhone]);
}
