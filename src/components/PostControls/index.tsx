import {
	type ComponentType,
	createContext,
	type CSSProperties,
	type MouseEvent,
	type ReactNode,
	type Ref,
	useContext,
} from 'react';

import { clsx } from 'clsx';

import { CountWheel } from '#/lib/custom-animations/CountWheel';
import { AnimatedLikeIcon } from '#/lib/custom-animations/LikeIcon';

import { formatPostStatCount } from '#/locale/intl/number';

import { atoms as a, useTheme } from '#/alf';

import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import type { Props as IconProps } from '#/components/icons/common';
import { Reply as Bubble } from '#/components/icons/Reply';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Text';
import { Tooltip } from '#/components/Tooltip';

import { m } from '#/paraglide/messages';

import * as css from './index.css';
import { RepostMenu } from './RepostMenu';
import { type PostControlsProps, usePostControlsActions } from './shared';
import { ShareMenu } from './ShareMenu';

const PostControlContext = createContext<{ active?: boolean }>({});
PostControlContext.displayName = 'PostControlContext';

type PostControlButtonProps = {
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	/** Visible hover/focus hint. Pass `null` to suppress it (e.g. when a wrapping menu owns the tooltip). */
	tooltip: string | null;
	children: ReactNode;
	active?: boolean;
	/** Color applied when `active`; icon + count inherit it via `currentColor`. */
	activeColor?: string;
	disabled?: boolean;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	style?: CSSProperties;
	ref?: Ref<HTMLButtonElement>;
};

/**
 * The compact post-control action button: a plain `<button>` that can render standalone (pass `onClick`) or
 * back a `Menu.Trigger render={...}`. The big thread anchor has its own button — see `AnchorPostControls`.
 */
function PostControlButton({
	active,
	activeColor,
	children,
	className,
	label,
	onClick,
	style,
	tooltip,
	...rest
}: PostControlButtonProps) {
	const button = (
		// Base UI's `Menu.Trigger render={...}` and `Tooltip` both clone this with their own props
		// (aria/data/handlers/id/ref) merged in, so spread them all onto the button — forwarding only the
		// ref wouldn't open the menu.
		<button
			type="button"
			aria-label={label}
			className={clsx(css.button, className)}
			style={active && activeColor ? { color: activeColor, ...style } : style}
			onClick={onClick}
			{...rest}
		>
			<PostControlContext.Provider value={{ active }}>{children}</PostControlContext.Provider>
		</button>
	);

	if (tooltip === null) {
		return button;
	}
	return <Tooltip label={tooltip}>{button}</Tooltip>;
}

/**
 * Wraps a control's icon in the hover-highlighted circle so the hover/focus chrome lands on the icon alone.
 * Use directly for a custom icon (e.g. the animated like heart); {@link PostControlButtonIcon} is the
 * shorthand for a plain icon component.
 */
function PostControlButtonIconBox({ children }: { children: ReactNode }) {
	return <span className={css.iconCircle}>{children}</span>;
}

/** A plain icon in the hover circle, inheriting the button color via `currentColor`. */
function PostControlButtonIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	return (
		<PostControlButtonIconBox>
			<Icon size="md" fill="currentColor" style={a.pointer_events_none} />
		</PostControlButtonIconBox>
	);
}

/** A count/label beside the icon, inheriting the button color and bolding when active. */
function PostControlButtonText({ children }: { children: ReactNode }) {
	const { active } = useContext(PostControlContext);
	return (
		<Text
			className={css.text}
			leading="none"
			selectable={false}
			size="md_sub"
			weight={active ? 'semiBold' : undefined}
		>
			{children}
		</Text>
	);
}

/** The compact post action bar used on the feed and thread rows. */
export function PostControls({
	post,
	feedContext,
	reqId,
	onPressReply,
	onPostReply,
	viaRepost,
}: PostControlsProps): React.ReactNode {
	const t = useTheme();

	const {
		hasLikeIconBeenToggled,
		onPressToggleLike,
		onQuote,
		onRepost,
		onShare,
		replyDisabled,
		requireAuth,
	} = usePostControlsActions({ post, feedContext, reqId, viaRepost, onPostReply });

	const repostCount = (post.repostCount ?? 0) + (post.quoteCount ?? 0);

	return (
		<div className={css.root}>
			<div className={css.primaryGroup}>
				<div className={clsx(css.primaryItem, replyDisabled && css.replyDisabled)}>
					<PostControlButton
						onClick={
							!replyDisabled
								? () =>
										requireAuth(() => {
											onPressReply();
										})
								: undefined
						}
						label={m['components.postControls.reply.a11y']({ count: post.replyCount || 0 })}
						tooltip={m['common.action.reply']()}
					>
						<PostControlButtonIcon icon={Bubble} />
						{typeof post.replyCount !== 'undefined' && post.replyCount > 0 && (
							<PostControlButtonText>{formatPostStatCount(post.replyCount)}</PostControlButtonText>
						)}
					</PostControlButton>
				</div>

				<div className={css.primaryItem}>
					<RepostMenu
						isReposted={!!post.viewer?.repost}
						onRepost={() => void onRepost()}
						onQuote={onQuote}
						embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
						tooltip={m['components.postControls.repost.action.repost']()}
						render={
							<PostControlButton
								label={m['components.postControls.repost.a11y']()}
								tooltip={null}
								active={!!post.viewer?.repost}
								activeColor={t.palette.positive_500}
							>
								<PostControlButtonIcon icon={Repost} />
								{repostCount > 0 && (
									<PostControlButtonText>{formatPostStatCount(repostCount)}</PostControlButtonText>
								)}
							</PostControlButton>
						}
					/>
				</div>

				<div className={css.primaryItem}>
					<PostControlButton
						active={Boolean(post.viewer?.like)}
						activeColor={t.palette.pink}
						tooltip={m['common.action.like']()}
						onClick={() => requireAuth(() => onPressToggleLike())}
						label={
							post.viewer?.like
								? m['components.postControls.like.a11y.unlike']({ count: post.likeCount || 0 })
								: m['components.postControls.like.a11y.like']({ count: post.likeCount || 0 })
						}
					>
						<PostControlButtonIconBox>
							<AnimatedLikeIcon
								isLiked={Boolean(post.viewer?.like)}
								hasBeenToggled={hasLikeIconBeenToggled}
							/>
						</PostControlButtonIconBox>
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
			<div className={css.secondaryGroup}>
				<ShareMenu
					post={post}
					onShare={onShare}
					tooltip={m['common.share.action.share']()}
					render={
						<PostControlButton label={m['components.postControls.share.a11y']()} tooltip={null}>
							<PostControlButtonIcon icon={ArrowShareRightIcon} />
						</PostControlButton>
					}
				/>
			</div>
		</div>
	);
}

export function PostControlsSkeleton() {
	// the rest-state row shows the bare icons, so the bars stand in at `ICON_SIZE` — the live `iconCircle` is
	// only the hover target and pulls itself back to that footprint with a negative margin. the trailing share
	// control reuses `secondaryGroup` verbatim so it pins to the same edge as the live row.
	return (
		<div className={css.root}>
			<div className={css.primaryGroup}>
				<div className={css.primaryItem}>
					<Skele.Pill blend size={css.ICON_SIZE} />
				</div>
				<div className={css.primaryItem}>
					<Skele.Pill blend size={css.ICON_SIZE} />
				</div>
				<div className={css.primaryItem}>
					<Skele.Pill blend size={css.ICON_SIZE} />
				</div>
			</div>
			<div className={css.secondaryGroup}>
				<Skele.Circle blend size={css.ICON_SIZE} />
			</div>
		</div>
	);
}
