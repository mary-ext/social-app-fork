import { type ComponentType, memo, type MouseEvent, type ReactNode, type Ref } from 'react';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { AnimatedLikeIcon } from '#/lib/custom-animations/LikeIcon';

import { atoms as a, useTheme } from '#/alf';

import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import type { Props as IconProps } from '#/components/icons/common';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Reply as Bubble } from '#/components/icons/Reply';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Skele from '#/components/Skeleton';
import { Tooltip } from '#/components/web/Tooltip';

import { PostOverflowMenu } from '../PostMenu';
import { RepostMenu } from '../RepostMenu';
import { type PostControlsProps, usePostControlsActions } from '../shared';
import { ShareMenu } from '../ShareMenu';
import { useBookmark } from '../useBookmark';
import * as css from './index.css';

type AnchorControlButtonProps = {
	className?: string;
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	/** Visible hover/focus hint; defaults to {@link label}. Pass `null` to suppress the tooltip. */
	tooltip?: string | null;
	children: ReactNode;
	active?: boolean;
	/** Color applied when `active`; the icon inherits it via `currentColor`. */
	activeColor?: string;
	disabled?: boolean;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	ref?: Ref<HTMLButtonElement>;
};

/** The anchor action button: a plain `<button>` that can render standalone or back a `Menu.Trigger render`. */
function AnchorControlButton({
	active,
	activeColor,
	children,
	label,
	onClick,
	className,
	tooltip,
	...rest
}: AnchorControlButtonProps) {
	const button = (
		// Base UI's `Menu.Trigger render={...}` and `Tooltip` clone this with their own props
		// (aria/data/handlers/id/ref) merged in, so spread them all onto the button.
		<button
			type="button"
			aria-label={label}
			className={clsx(css.button, className)}
			style={active && activeColor ? { color: activeColor } : undefined}
			onClick={onClick}
			{...rest}
		>
			{children}
		</button>
	);

	if (tooltip === null) {
		return button;
	}
	return <Tooltip label={tooltip ?? label}>{button}</Tooltip>;
}

/** Wraps an icon in the hover-highlighted {@link css.iconCircle} so the chrome lands on the icon alone. */
function AnchorControlButtonIconBox({ children }: { children: ReactNode }) {
	return <span className={css.iconCircle}>{children}</span>;
}

/** A plain icon in the hover circle, inheriting the button color via `currentColor`. */
function AnchorControlButtonIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	return (
		<AnchorControlButtonIconBox>
			<Icon width={20} height={20} fill="currentColor" style={a.pointer_events_none} />
		</AnchorControlButtonIconBox>
	);
}

/**
 * The enlarged post action bar used on the focused thread anchor. It omits the per-control counts — the
 * anchor surfaces those in its own stats row — and owns its own button chrome separately from the compact
 * {@link PostControls}.
 */
let AnchorPostControls = ({
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
}: PostControlsProps): React.ReactNode => {
	const t = useTheme();
	const { t: l } = useLingui();

	const {
		hasLikeIconBeenToggled,
		onPressToggleLike,
		onQuote,
		onRepost,
		onShare,
		replyDisabled,
		requireAuth,
	} = usePostControlsActions({ post, feedContext, reqId, viaRepost, logContext, onPostReply });
	const bookmark = useBookmark(post);

	return (
		<div className={css.root}>
			<AnchorControlButton
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
				tooltip={l`Reply`}
				className={clsx(replyDisabled && css.replyDisabled)}
			>
				<AnchorControlButtonIcon icon={Bubble} />
			</AnchorControlButton>

			<RepostMenu
				isReposted={!!post.viewer?.repost}
				onRepost={() => void onRepost()}
				onQuote={onQuote}
				embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
				render={
					<AnchorControlButton
						label={l`Repost or quote post`}
						tooltip={l`Repost`}
						active={!!post.viewer?.repost}
						activeColor={t.palette.positive_500}
					>
						<AnchorControlButtonIcon icon={Repost} />
					</AnchorControlButton>
				}
			/>

			<AnchorControlButton
				active={Boolean(post.viewer?.like)}
				activeColor={t.palette.pink}
				tooltip={l`Like`}
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
				<AnchorControlButtonIconBox>
					<AnimatedLikeIcon
						size={20}
						isLiked={Boolean(post.viewer?.like)}
						hasBeenToggled={hasLikeIconBeenToggled}
					/>
				</AnchorControlButtonIconBox>
			</AnchorControlButton>

			<AnchorControlButton
				active={bookmark.isBookmarked}
				activeColor={t.palette.primary_500}
				label={bookmark.label}
				tooltip={l`Bookmark`}
				onClick={bookmark.onToggle}
			>
				<AnchorControlButtonIcon icon={bookmark.isBookmarked ? BookmarkFilled : Bookmark} />
			</AnchorControlButton>
			<ShareMenu
				post={post}
				onShare={onShare}
				render={
					<AnchorControlButton label={l`Open share menu`} tooltip={l`Share`}>
						<AnchorControlButtonIcon icon={ArrowShareRightIcon} />
					</AnchorControlButton>
				}
			/>
			<PostOverflowMenu
				post={post}
				postFeedContext={feedContext}
				postReqId={reqId}
				record={record}
				richText={richText}
				threadgateRecord={threadgateRecord}
				onShowLess={onShowLess}
				logContext={logContext}
				render={
					<AnchorControlButton label={l`Open post options menu`} tooltip={l`More`}>
						<AnchorControlButtonIcon icon={DotsHorizontal} />
					</AnchorControlButton>
				}
			/>
		</div>
	);
};
AnchorPostControls = memo(AnchorPostControls);
export { AnchorPostControls };

/** Loading placeholder matching the anchor action bar's layout and control density. */
export function AnchorPostControlsSkeleton() {
	const padding = 4;
	const size = 32 - padding * 2;

	return (
		<div className={css.root}>
			<Skele.Circle blend size={size} />
			<Skele.Circle blend size={size} />
			<Skele.Circle blend size={size} />
			<Skele.Circle blend size={size} />
			<Skele.Circle blend size={size} />
			<Skele.Circle blend size={size} />
		</div>
	);
}
