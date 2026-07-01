import type { ComponentType, MouseEvent, ReactNode, Ref } from 'react';
import { clsx } from 'clsx';

import { AnimatedLikeIcon } from '#/lib/custom-animations/LikeIcon';

import { atoms as a, useTheme } from '#/alf';

import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import type { Props as IconProps } from '#/components/icons/common';
import { Reply as Bubble } from '#/components/icons/Reply';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Skele from '#/components/Skeleton';
import { Tooltip } from '#/components/Tooltip';

import { m } from '#/paraglide/messages';

import { RepostMenu } from '../RepostMenu';
import { type PostControlsProps, usePostControlsActions } from '../shared';
import { ShareMenu } from '../ShareMenu';
import * as css from './index.css';

type AnchorControlButtonProps = {
	className?: string;
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	/** Visible hover/focus hint. Pass `null` to suppress it (e.g. when a wrapping menu owns the tooltip). */
	tooltip: string | null;
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
	return <Tooltip label={tooltip}>{button}</Tooltip>;
}

/** Wraps an icon in the hover-highlighted {@link css.iconCircle} so the chrome lands on the icon alone. */
function AnchorControlButtonIconBox({ children }: { children: ReactNode }) {
	return <span className={css.iconCircle}>{children}</span>;
}

/** A plain icon in the hover circle, inheriting the button color via `currentColor`. */
function AnchorControlButtonIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	return (
		<AnchorControlButtonIconBox>
			<Icon size="lg" fill="currentColor" style={a.pointer_events_none} />
		</AnchorControlButtonIconBox>
	);
}

/**
 * The enlarged post action bar used on the focused thread anchor. It omits the per-control counts — the
 * anchor surfaces those in its own stats row — and owns its own button chrome separately from the compact
 * {@link PostControls}.
 */
function AnchorPostControls({
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
				label={m['components.postControls.reply.a11y']({ count: post.replyCount || 0 })}
				tooltip={m['common.action.reply']()}
				className={clsx(replyDisabled && css.replyDisabled)}
			>
				<AnchorControlButtonIcon icon={Bubble} />
			</AnchorControlButton>

			<RepostMenu
				isReposted={!!post.viewer?.repost}
				onRepost={() => void onRepost()}
				onQuote={onQuote}
				embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
				tooltip={m['components.postControls.repost.action.repost']()}
				render={
					<AnchorControlButton
						label={m['components.postControls.repost.a11y']()}
						tooltip={null}
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
				tooltip={m['common.action.like']()}
				onClick={() => requireAuth(() => onPressToggleLike())}
				label={
					post.viewer?.like
						? m['components.postControls.like.a11y.unlike']({ count: post.likeCount || 0 })
						: m['components.postControls.like.a11y.like']({ count: post.likeCount || 0 })
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

			<ShareMenu
				post={post}
				onShare={onShare}
				tooltip={m['common.share.action.share']()}
				render={
					<AnchorControlButton label={m['components.postControls.share.a11y']()} tooltip={null}>
						<AnchorControlButtonIcon icon={ArrowShareRightIcon} />
					</AnchorControlButton>
				}
			/>
		</div>
	);
}
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
		</div>
	);
}
