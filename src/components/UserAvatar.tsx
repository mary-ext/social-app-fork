import type { ComponentPropsWithoutRef, Ref } from 'react';

import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { Avatar } from '@base-ui/react/avatar';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { toImageCdnUrl } from '#/lib/bsky-cdn';

import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';

import { Text } from '#/components/Text';
import * as styles from '#/components/UserAvatar.css';

import DefaultAlgoAvatar from '#/assets/default-avatar-algo.svg';
import DefaultLabelerAvatar from '#/assets/default-avatar-labeler.svg';
import DefaultListAvatar from '#/assets/default-avatar-list.svg';
import DefaultUserAvatar from '#/assets/default-avatar-user.svg';

export type UserAvatarType = 'algo' | 'labeler' | 'list' | 'user';

export type BaseUserAvatarProps = {
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
		/** styling escape hatch merged onto the root. */
		className?: string;
		/** Forwarded to the avatar host so it can back a headless trigger (e.g. a hover card). */
		ref?: Ref<HTMLSpanElement>;
	};

const squareRadius = (size: number) => (size > 32 ? 8 : 3);

const DEFAULT_AVATARS = {
	algo: DefaultAlgoAvatar,
	labeler: DefaultLabelerAvatar,
	list: DefaultListAvatar,
	user: DefaultUserAvatar,
} satisfies Record<UserAvatarType, unknown>;

// use the thumbnail preset for small avatar renders until lexicons expose one.
const hackModifyThumbnailPath = (uri: string, isEnabled: boolean) =>
	isEnabled ? toImageCdnUrl(uri, 'avatar_thumbnail') : uri;

/** Avatar image with a typed vector fallback, moderation blur/alert, optional live badge, and inset border. */
export function UserAvatar({
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
	const DefaultAvatar = DEFAULT_AVATARS[type];

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
				<DefaultAvatar width={size} height={size} />
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
}
