import type { MouseEvent, ReactNode } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { getModerationCauseKey } from '#/lib/moderation';
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
import { RichText, type RichTextProps } from '#/components/RichText';
import { Text, type TextProps } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { PreviewableUserAvatar, UserAvatar } from '#/components/UserAvatar';
import { Button, type ButtonProps, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Pills from '#/components/web/Pills';
import * as css from '#/components/web/ProfileCard.css';
import * as Skeleton from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';

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
	return (
		// BlockLink (role=link <div>), not an <a>, so the row can hold interactive children (a previewable
		// avatar, a follow button) without nesting them in an anchor
		<BlockLink
			className={clsx(css.link, className)}
			label={m['common.profile.a11y.viewNamed']({
				name: profile.displayName || sanitizeHandle(profile.handle),
			})}
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

/** Profile bio as inline richtext; renders nothing when empty or when the viewer is blocked. */
export function Description({
	align,
	color,
	numberOfLines = 3,
	profile: profileUnshadowed,
	size,
}: {
	numberOfLines?: number;
	profile: AnyProfileView;
} & Pick<RichTextProps, 'align' | 'color' | 'size'>) {
	const profile = useProfileShadow(profileUnshadowed);
	if (!('description' in profile) || !profile.description) {
		return null;
	}
	if (
		profile.viewer &&
		(profile.viewer.blockedBy || profile.viewer.blocking || profile.viewer.blockingByList)
	) {
		return null;
	}
	return (
		<div className={css.description}>
			<RichText
				align={align}
				color={color}
				disableLinks
				numberOfLines={numberOfLines}
				size={size}
				value={profile.description}
			/>
		</div>
	);
}

/** Skeleton bio bars standing in for the description while a profile loads. */
export function DescriptionPlaceholder({ numberOfLines = 3 }: { numberOfLines?: number }) {
	return (
		<div className={css.descriptionPlaceholder}>
			<Skeleton.Lines blend={false} count={numberOfLines} lastWidth={60} />
		</div>
	);
}

/** Moderation alert/inform pills plus a "follows you" marker; renders nothing when there's none to show. */
export function Labels({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const moderation = moderateProfile(profile, moderationOpts);
	const modui = getDisplayRestrictions(moderation, DisplayContext.ProfileList);
	const followedBy = profile.viewer?.followedBy;

	if (!followedBy && modui.alerts.length === 0 && modui.informs.length === 0) {
		return null;
	}

	return (
		<Pills.Row className={css.labels}>
			{followedBy && <Pills.FollowsYou />}
			{modui.alerts.map((alert) => (
				<Pills.Label cause={alert} key={getModerationCauseKey(alert)} />
			))}
			{modui.informs.map((inform) => (
				<Pills.Label cause={inform} key={getModerationCauseKey(inform)} />
			))}
		</Pills.Row>
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
			Toast.show(m['common.follow.a11y.following']({ name: name() }));
			onFollow?.();
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(m['common.error.generic'](), { type: 'error' });
			}
		}
	};

	const onPressUnfollow = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		try {
			await queueUnfollow();
			Toast.show(m['common.follow.noLongerFollowing']({ name: name() }));
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(m['common.error.generic'](), { type: 'error' });
			}
		}
	};

	const unfollowLabel = m['common.follow.action.following']();
	const followLabel = profile.viewer?.followedBy
		? m['common.follow.action.followBack']()
		: m['common.follow.action.follow']();

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
