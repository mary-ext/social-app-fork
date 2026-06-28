import { type ComponentPropsWithoutRef, memo, type Ref } from 'react';
import type { AnyProfileView, AppBskyEmbedExternal } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';
import { Avatar } from '@base-ui/react/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { convertCdnPreset } from '#/lib/media/util';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import { Text } from '#/components/Text';
import * as styles from '#/components/UserAvatar.css';
import * as Dialog from '#/components/web/Dialog';
import { Link } from '#/components/web/Link';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';

import { IS_WEB_TOUCH_DEVICE } from '#/env';
import { useActorStatus } from '#/features/liveNow';
import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
import { LiveStatusDialog } from '#/features/liveNow/components/LiveStatus';
import { m } from '#/paraglide/messages';

export type UserAvatarType = 'algo' | 'labeler' | 'list' | 'user';

type BaseUserAvatarProps = {
	type?: UserAvatarType;
	shape?: 'circle' | 'square';
	size: number;
	avatar?: string | null;
	live?: boolean;
	hideLiveBadge?: boolean;
};

type UserAvatarProps = BaseUserAvatarProps &
	// remaining span attributes pass straight through to the host, so a headless trigger (e.g. a hover card)
	// can inject its hover handlers, `aria-*`, `data-*`, and ref onto a bare avatar.
	Omit<ComponentPropsWithoutRef<'span'>, 'color' | 'onLoad' | 'style'> & {
		moderation?: DisplayRestrictions;
		noBorder?: boolean;
		onLoad?: () => void;
		/**
		 * Styling escape hatch merged onto the root. The root's own styles sit in the `components` cascade layer,
		 * so an (unlayered) class here outranks them — a `border-radius` set this way is inherited by every
		 * layer.
		 */
		className?: string;
		/** Forwarded to the avatar host so it can back a headless trigger (e.g. a hover card). */
		ref?: Ref<HTMLSpanElement>;
	};

type PreviewableUserAvatarProps = BaseUserAvatarProps & {
	moderation?: DisplayRestrictions;
	profile: AnyProfileView;
	disableHoverCard?: boolean;
	disableNavigation?: boolean;
	onBeforePress?: () => void;
	/** Sets the link/button's `tabindex`; pass `-1` to keep it clickable but out of the tab order. */
	tabIndex?: number;
};

// labeler shield fill — mirrors the `temp_purple` labeler token.
const LABELER_PURPLE = 'rgb(105 0 255)';

const squareRadius = (size: number) => (size > 32 ? 8 : 3);

/** Vector fallback shown when an avatar has no image, keyed by actor type and shape. */
function DefaultAvatar({
	type,
	shape,
	size,
}: {
	type: UserAvatarType;
	shape: 'circle' | 'square';
	size: number;
}) {
	const squareStyle =
		shape === 'square' ? { borderRadius: squareRadius(size), overflow: 'hidden' as const } : undefined;

	if (type === 'algo') {
		// Font Awesome Pro 6.4.0 by @fontawesome — https://fontawesome.com/license (Commercial License)
		return (
			<svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={squareStyle}>
				<rect width="32" height="32" rx="4" fill="#0070FF" />
				<path
					d="M13.5 7.25C13.5 6.55859 14.0586 6 14.75 6C20.9648 6 26 11.0352 26 17.25C26 17.9414 25.4414 18.5 24.75 18.5C24.0586 18.5 23.5 17.9414 23.5 17.25C23.5 12.418 19.582 8.5 14.75 8.5C14.0586 8.5 13.5 7.94141 13.5 7.25ZM8.36719 14.6172L12.4336 18.6836L13.543 17.5742C13.5156 17.4727 13.5 17.3633 13.5 17.25C13.5 16.5586 14.0586 16 14.75 16C15.4414 16 16 16.5586 16 17.25C16 17.9414 15.4414 18.5 14.75 18.5C14.6367 18.5 14.5312 18.4844 14.4258 18.457L13.3164 19.5664L17.3828 23.6328C17.9492 24.1992 17.8438 25.1484 17.0977 25.4414C16.1758 25.8008 15.1758 26 14.125 26C9.63672 26 6 22.3633 6 17.875C6 16.8242 6.19922 15.8242 6.5625 14.9023C6.85547 14.1602 7.80469 14.0508 8.37109 14.6172H8.36719ZM14.75 9.75C18.8906 9.75 22.25 13.1094 22.25 17.25C22.25 17.9414 21.6914 18.5 21 18.5C20.3086 18.5 19.75 17.9414 19.75 17.25C19.75 14.4883 17.5117 12.25 14.75 12.25C14.0586 12.25 13.5 11.6914 13.5 11C13.5 10.3086 14.0586 9.75 14.75 9.75Z"
					fill="white"
				/>
			</svg>
		);
	}
	if (type === 'list') {
		// Font Awesome Pro 6.4.0 by @fontawesome — https://fontawesome.com/license (Commercial License)
		return (
			<svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={squareStyle}>
				<path
					d="M28 0H4C1.79086 0 0 1.79086 0 4V28C0 30.2091 1.79086 32 4 32H28C30.2091 32 32 30.2091 32 28V4C32 1.79086 30.2091 0 28 0Z"
					fill="#0070FF"
				/>
				<path
					d="M22.1529 22.3542C23.4522 22.4603 24.7593 22.293 25.9899 21.8629C26.0369 21.2838 25.919 20.7032 25.6497 20.1884C25.3805 19.6735 24.9711 19.2454 24.4687 18.9535C23.9663 18.6617 23.3916 18.518 22.8109 18.5392C22.2303 18.5603 21.6676 18.7454 21.1878 19.0731M22.1529 22.3542C22.1489 21.1917 21.8142 20.0534 21.1878 19.0741ZM10.8111 19.0741C10.3313 18.7468 9.7687 18.5619 9.18826 18.5409C8.60781 18.5199 8.03327 18.6636 7.53107 18.9554C7.02888 19.2472 6.61953 19.6752 6.35036 20.1899C6.08119 20.7046 5.96319 21.285 6.01001 21.8639C7.23969 22.2964 8.5461 22.4632 9.84497 22.3531M10.8111 19.0741C10.1851 20.0535 9.84865 21.1908 9.84497 22.3531ZM19.0759 10.077C19.0759 10.8931 18.7518 11.6757 18.1747 12.2527C17.5977 12.8298 16.815 13.154 15.9989 13.154C15.1829 13.154 14.4002 12.8298 13.8232 12.2527C13.2461 11.6757 12.922 10.8931 12.922 10.077C12.922 9.26092 13.2461 8.47828 13.8232 7.90123C14.4002 7.32418 15.1829 7 15.9989 7C16.815 7 17.5977 7.32418 18.1747 7.90123C18.7518 8.47828 19.0759 9.26092 19.0759 10.077ZM25.2299 13.154C25.2299 13.457 25.1702 13.7571 25.0542 14.0371C24.9383 14.3171 24.7683 14.5715 24.554 14.7858C24.3397 15.0001 24.0853 15.1701 23.8053 15.2861C23.5253 15.402 23.2252 15.4617 22.9222 15.4617C22.6191 15.4617 22.319 15.402 22.039 15.2861C21.759 15.1701 21.5046 15.0001 21.2903 14.7858C21.0761 14.5715 20.9061 14.3171 20.7901 14.0371C20.6741 13.7571 20.6144 13.457 20.6144 13.154C20.6144 12.5419 20.8576 11.9549 21.2903 11.5222C21.7231 11.0894 22.3101 10.8462 22.9222 10.8462C23.5342 10.8462 24.1212 11.0894 24.554 11.5222C24.9868 11.9549 25.2299 12.5419 25.2299 13.154ZM11.3835 13.154C11.3835 13.457 11.3238 13.7571 11.2078 14.0371C11.0918 14.3171 10.9218 14.5715 10.7075 14.7858C10.4932 15.0001 10.2388 15.1701 9.95886 15.2861C9.67887 15.402 9.37878 15.4617 9.07572 15.4617C8.77266 15.4617 8.47257 15.402 8.19259 15.2861C7.9126 15.1701 7.6582 15.0001 7.4439 14.7858C7.22961 14.5715 7.05962 14.3171 6.94365 14.0371C6.82767 13.7571 6.76798 13.457 6.76798 13.154C6.76798 12.5419 7.01112 11.9549 7.4439 11.5222C7.87669 11.0894 8.46367 10.8462 9.07572 10.8462C9.68777 10.8462 10.2748 11.0894 10.7075 11.5222C11.1403 11.9549 11.3835 12.5419 11.3835 13.154Z"
					fill="white"
				/>
				<path
					d="M22 22C22 25.3137 19.3137 25.5 16 25.5C12.6863 25.5 10 25.3137 10 22C10 18.6863 12.6863 16 16 16C19.3137 16 22 18.6863 22 22Z"
					fill="white"
				/>
			</svg>
		);
	}
	if (type === 'labeler') {
		return (
			<svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={squareStyle}>
				{shape === 'square' ? (
					<rect x="0" y="0" width="32" height="32" rx="3" fill={LABELER_PURPLE} />
				) : (
					<circle cx="16" cy="16" r="16" fill={LABELER_PURPLE} />
				)}
				<path
					d="M24 9.75L16 7L8 9.75V15.9123C8 20.8848 12 23 16 25.1579C20 23 24 20.8848 24 15.9123V9.75Z"
					stroke="white"
					strokeWidth="2"
					strokeLinecap="square"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={squareStyle}>
			<circle cx="12" cy="12" r="12" fill="#0070ff" />
			<circle cx="12" cy="9.5" r="3.5" fill="#fff" />
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="#fff"
				d="M 12.058 22.784 C 9.422 22.784 7.007 21.836 5.137 20.262 C 5.667 17.988 8.534 16.25 11.99 16.25 C 15.494 16.25 18.391 18.036 18.864 20.357 C 17.01 21.874 14.64 22.784 12.058 22.784 Z"
			/>
		</svg>
	);
}

// HACK: we serve smaller avis but haven't updated lexicons to expose them; string-replace to the thumbnail
// preset for small renders. -prf
const hackModifyThumbnailPath = (uri: string, isEnabled: boolean) =>
	isEnabled ? convertCdnPreset(uri, 'avatar_thumbnail') : uri;

/** Avatar image with a typed vector fallback, moderation blur/alert, optional live badge, and inset border. */
export const UserAvatar = memo(function UserAvatar({
	type = 'user',
	shape,
	size,
	avatar,
	moderation,
	onLoad,
	live,
	hideLiveBadge,
	noBorder,
	className,
	...rest
}: UserAvatarProps) {
	const finalShape = shape ?? (type === 'user' ? 'circle' : 'square');
	const radius = finalShape === 'circle' ? '50%' : `${squareRadius(size)}px`;

	return (
		<Avatar.Root
			className={clsx(styles.root, className)}
			style={assignInlineVars({
				[styles.alertScaleVar]: String(size / 42),
				[styles.borderWidthVar]: `${size > 16 ? 2 : 1}px`,
				[styles.radiusVar]: radius,
				[styles.sizeVar]: `${size}px`,
			})}
			{...rest}
		>
			{avatar && (
				<span className={styles.imageClip}>
					<Avatar.Image
						className={clsx(styles.image, moderation?.blurs.length && styles.blurred)}
						src={hackModifyThumbnailPath(avatar, size < 90)}
						onLoadingStatusChange={(status) => {
							if (status === 'loaded') {
								onLoad?.();
							}
						}}
					/>
				</span>
			)}
			<Avatar.Fallback className={styles.fallback} delay={avatar ? 600 : undefined}>
				<DefaultAvatar type={type} shape={finalShape} size={size} />
			</Avatar.Fallback>
			{!noBorder &&
				(live ? (
					<span aria-hidden className={styles.liveBorder} />
				) : (
					<span aria-hidden className={styles.border} />
				))}
			{live && size > 16 && !hideLiveBadge && <LiveIndicator size={size > 32 ? 'small' : 'tiny'} />}
			{!!moderation?.alerts.length && (
				<Text aria-hidden className={styles.alert} align="center" color="white" size="sm" weight="bold">
					!
				</Text>
			)}
		</Avatar.Root>
	);
});

/** {@link UserAvatar} wrapped with a profile hover card and a link/live-status affordance. */
export const PreviewableUserAvatar = memo(function PreviewableUserAvatar({
	moderation,
	profile,
	disableHoverCard,
	disableNavigation,
	onBeforePress,
	live,
	tabIndex,
	...props
}: PreviewableUserAvatarProps) {
	const queryClient = useQueryClient();
	const status = useActorStatus(profile);
	const liveHandle = Dialog.useDialogHandle();

	const name = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle));
	const circular = props.type !== 'algo' && props.type !== 'list';
	const radius = circular ? '50%' : props.size > 32 ? '8px' : '3px';

	const avatarEl = (
		<UserAvatar
			avatar={profile.avatar}
			moderation={moderation}
			type={profile.associated?.labeler ? 'labeler' : 'user'}
			live={status.isActive || live}
			{...props}
		/>
	);

	// live status on touch opens a dialog on tap (there's no hover); elsewhere the avatar links to the profile.
	const isTouchLive = status.isActive && IS_WEB_TOUCH_DEVICE;

	const trigger = disableNavigation ? (
		avatarEl
	) : isTouchLive ? (
		<button
			type="button"
			aria-label={m['common.a11y.avatar']({ name })}
			className={styles.preview}
			style={assignInlineVars({ [styles.previewRadiusVar]: radius })}
			tabIndex={tabIndex}
			onClick={() => liveHandle.open(null)}
		>
			{avatarEl}
		</button>
	) : (
		<Link
			className={styles.preview}
			label={m['common.a11y.avatar']({ name })}
			onPress={() => {
				onBeforePress?.();
				unstableCacheProfileView(queryClient, profile);
			}}
			style={assignInlineVars({ [styles.previewRadiusVar]: radius })}
			tabIndex={tabIndex}
			to={makeProfileLink({ did: profile.did })}
		>
			{avatarEl}
		</Link>
	);

	return (
		<>
			{disableHoverCard ? trigger : <ProfileHoverCard did={profile.did}>{trigger}</ProfileHoverCard>}
			{!disableNavigation && isTouchLive && (
				<LiveStatusDialog
					embed={status.embed as AppBskyEmbedExternal.View}
					handle={liveHandle}
					profile={profile}
					status={status}
				/>
			)}
		</>
	);
});
