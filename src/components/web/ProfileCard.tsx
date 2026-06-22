import type { MouseEvent, ReactNode } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { BlockLink } from '#/components/BlockLink';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text, type TextProps } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { PreviewableUserAvatar, UserAvatar } from '#/components/UserAvatar';
import { Button, type ButtonProps, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as css from '#/components/web/ProfileCard.css';

import { useActorStatus } from '#/features/liveNow';

/** Vertical card container: stacks the header, labels, and description. */
export function Outer({ children }: { children: ReactNode }) {
	return <div className={css.outer}>{children}</div>;
}

/** Horizontal row laying out an avatar, name/handle, and trailing action. */
export function Header({ children }: { children: ReactNode }) {
	return <div className={css.header}>{children}</div>;
}

/** Block link to a profile wrapping a card row; `className` supplies the row layout. */
export function Link({
	children,
	className,
	onPress,
	profile,
}: {
	children: ReactNode;
	className?: string;
	onPress?: () => void;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	return (
		// BlockLink (role=link <div>), not an <a>, so the row can hold interactive children (a previewable
		// avatar, a follow button) without nesting them in an anchor
		<BlockLink
			className={clsx(css.link, className)}
			label={l`View ${profile.displayName || sanitizeHandle(profile.handle)}’s profile`}
			onBeforePress={onPress}
			to={makeProfileLink({ did: profile.did })}
		>
			<div>{children}</div>
		</BlockLink>
	);
}

/** A profile avatar; previewable on hover unless `disabledPreview` is set. */
export function Avatar({
	disabledPreview,
	liveOverride,
	moderationOpts,
	onPress,
	profile,
	size = 40,
}: {
	disabledPreview?: boolean;
	liveOverride?: boolean;
	moderationOpts: ModerationOptions;
	onPress?: () => void;
	profile: AnyProfileView;
	size?: number;
}) {
	const moderation = moderateProfile(profile, moderationOpts);
	const { isActive: live } = useActorStatus(profile);

	return disabledPreview ? (
		<UserAvatar
			avatar={profile.avatar}
			live={liveOverride ?? live}
			moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
			size={size}
			type={profile.associated?.labeler ? 'labeler' : 'user'}
		/>
	) : (
		<PreviewableUserAvatar
			live={liveOverride ?? live}
			moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
			onBeforePress={onPress}
			profile={profile}
			size={size}
		/>
	);
}

/** Stacked name + handle, or an inline single-line variant when `inline` is set. */
export function NameAndHandle({
	inline = false,
	moderationOpts,
	profile,
}: {
	inline?: boolean;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	if (inline) {
		return <InlineNameAndHandle moderationOpts={moderationOpts} profile={profile} />;
	}
	return (
		<div className={css.nameAndHandle}>
			<Name moderationOpts={moderationOpts} profile={profile} />
			<Handle profile={profile} />
		</div>
	);
}

function InlineNameAndHandle({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const moderation = moderateProfile(profile, moderationOpts);
	const name = sanitizeDisplayName(
		profile.displayName || sanitizeHandle(profile.handle),
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);
	const handle = sanitizeHandle(profile.handle, '@');
	return (
		<div className={css.inlineRow}>
			<Text className={css.inlineName} numberOfLines={1} weight="semiBold">
				{forceLTR(name)}
			</Text>
			<div className={css.inlineBadges}>
				<ProfileBadges profile={profile} size="md" />
			</div>
			<Text className={css.inlineHandle} color="textContrastMedium" numberOfLines={1}>
				{NON_BREAKING_SPACE + handle}
			</Text>
		</div>
	);
}

/** Display name with trailing verification/badge cluster; `size`/`leading` tune the name text. */
export function Name({
	leading,
	moderationOpts,
	profile,
	size = 'md',
}: {
	leading?: TextProps['leading'];
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	size?: TextProps['size'];
}) {
	const moderation = moderateProfile(profile, moderationOpts);
	const name = sanitizeDisplayName(
		profile.displayName || sanitizeHandle(profile.handle),
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);
	return (
		<div className={css.nameRow}>
			<Text className={css.nameText} leading={leading} numberOfLines={1} size={size} weight="semiBold">
				{name}
			</Text>
			<div className={css.badges}>
				<ProfileBadges profile={profile} size="md" />
			</div>
		</div>
	);
}

/** The `@handle` line in muted contrast. */
export function Handle({ profile }: { profile: AnyProfileView }) {
	const handle = sanitizeHandle(profile.handle, '@');
	return (
		<Text color="textContrastMedium" numberOfLines={1}>
			{handle}
		</Text>
	);
}

/** Skeleton circle standing in for an avatar while a profile loads. */
export function AvatarPlaceholder({ size = 40 }: { size?: number }) {
	return (
		<div className={css.avatarPlaceholder} style={assignInlineVars({ [css.avatarSizeVar]: `${size}px` })} />
	);
}

/** Skeleton name + handle bars standing in for the name column while a profile loads. */
export function NameAndHandlePlaceholder() {
	return (
		<div className={css.nameAndHandlePlaceholder}>
			<div className={css.namePlaceholderBar} />
			<div className={css.handlePlaceholderBar} />
		</div>
	);
}

export type FollowButtonProps = {
	colorInverted?: boolean;
	moderationOpts: ModerationOptions;
	onFollow?: () => void;
	profile: AnyProfileView;
	withIcon?: boolean;
} & Partial<Omit<ButtonProps, 'children' | 'label'>>;

/** Follow/unfollow toggle. Renders nothing for the signed-in user's own profile or when signed out. */
export function FollowButton(props: FollowButtonProps) {
	const { currentAccount, hasSession } = useSession();
	const isMe = props.profile.did === currentAccount?.did;
	return hasSession && !isMe ? <FollowButtonInner {...props} /> : null;
}

function FollowButtonInner({
	colorInverted,
	moderationOpts,
	onFollow,
	profile: profileUnshadowed,
	withIcon = true,
	...rest
}: FollowButtonProps) {
	const { t: l } = useLingui();
	const profile = useProfileShadow(profileUnshadowed);
	const moderation = moderateProfile(profile, moderationOpts);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);
	const isRound = rest.shape === 'round';

	const name = () =>
		sanitizeDisplayName(
			profile.displayName || profile.handle,
			getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
		);

	const onPressFollow = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		try {
			await queueFollow();
			Toast.show(l`Following ${name()}`);
			onFollow?.();
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(l`An issue occurred, please try again.`, { type: 'error' });
			}
		}
	};

	const onPressUnfollow = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		try {
			await queueUnfollow();
			Toast.show(l`No longer following ${name()}`);
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(l`An issue occurred, please try again.`, { type: 'error' });
			}
		}
	};

	const unfollowLabel = l({
		message: 'Following',
		comment: 'User is following this account, click to unfollow',
	});
	const followLabel = profile.viewer?.followedBy
		? l({ message: 'Follow back', comment: 'User is not following this account, click to follow back' })
		: l({ message: 'Follow', comment: 'User is not following this account, click to follow' });

	if (!profile.viewer) return null;
	if (profile.viewer.blockedBy || profile.viewer.blocking || profile.viewer.blockingByList) return null;

	return profile.viewer.following ? (
		<Button
			label={unfollowLabel}
			size="small"
			variant="solid"
			color="secondary"
			{...rest}
			onClick={(e) => void onPressUnfollow(e)}
		>
			{withIcon && <ButtonIcon icon={CheckIcon} />}
			{!isRound && <ButtonText>{unfollowLabel}</ButtonText>}
		</Button>
	) : (
		<Button
			label={followLabel}
			size="small"
			variant="solid"
			color={colorInverted ? 'secondary_inverted' : 'primary'}
			{...rest}
			onClick={(e) => void onPressFollow(e)}
		>
			{withIcon && <ButtonIcon icon={PlusIcon} />}
			{!isRound && <ButtonText>{followLabel}</ButtonText>}
		</Button>
	);
}
