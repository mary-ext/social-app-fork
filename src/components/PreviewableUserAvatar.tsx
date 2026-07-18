import { memo } from 'react';

import type { AnyProfileView, AppBskyEmbedExternal } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import * as Dialog from '#/components/Dialog';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { type BaseUserAvatarProps, UserAvatar } from '#/components/UserAvatar';
import * as styles from '#/components/UserAvatar.css';
import { Link } from '#/components/web/Link';

import { IS_WEB_TOUCH_DEVICE } from '#/env';
import { LiveStatusDialog } from '#/features/liveNow/components/LiveStatusDialog';
import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';

type PreviewableUserAvatarProps = BaseUserAvatarProps & {
	moderation?: DisplayRestrictions;
	profile: AnyProfileView;
	disableHoverCard?: boolean;
	disableNavigation?: boolean;
	onBeforePress?: () => void;
	/** Sets the link/button's `tabindex`; pass `-1` to keep it clickable but out of the tab order. */
	tabIndex?: number;
};

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

	const name = sanitizeDisplayName(profile.displayName || profile.handle);
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
