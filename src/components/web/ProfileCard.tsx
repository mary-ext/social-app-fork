import type { MouseEvent, ReactNode } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { weightedIndex } from '@mary/array-fns';

import { clsx } from 'clsx';

import { getModerationCauseKey } from '#/lib/moderation';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isAbortError } from '#/lib/strings/errors';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { BlockLink } from '#/components/BlockLink';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import { RichText, type RichTextProps } from '#/components/RichText';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Pills from '#/components/web/Pills';
import * as css from '#/components/web/ProfileCard.css';
import * as Skeleton from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';

/**
 * default profile card presentation displaying an avatar, name/handle, follow button, moderation labels, and
 * bio.
 *
 * @param descriptionLines max bio lines before truncation.
 * @param followButtonProps overrides forwarded to the trailing FollowButton.
 * @param showLabels whether to render the moderation/follows-you Labels row.
 * @param topBorder whether the row carries a top divider.
 */
export function Default({
	descriptionLines = 3,
	followButtonProps,
	moderationOpts,
	onPress,
	profile,
	showLabels = true,
	topBorder,
}: {
	descriptionLines?: number;
	followButtonProps?: Partial<Omit<FollowButtonProps, 'moderationOpts' | 'profile'>>;
	moderationOpts: ModerationOptions;
	onPress?: () => void;
	profile: AnyProfileView;
	showLabels?: boolean;
	topBorder?: boolean;
}) {
	return (
		<Link className={css.defaultRow({ topBorder })} onPress={onPress} profile={profile}>
			<Outer>
				<Header>
					<Avatar moderationOpts={moderationOpts} profile={profile} />
					<NameAndHandle moderationOpts={moderationOpts} profile={profile} />
					<FollowButton moderationOpts={moderationOpts} profile={profile} {...followButtonProps} />
				</Header>
				{showLabels && <Labels moderationOpts={moderationOpts} profile={profile} />}
				<Description numberOfLines={descriptionLines} profile={profile} />
			</Outer>
		</Link>
	);
}

/** Vertical card container: stacks the header, labels, and description. */
export function Outer({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.outer, className)}>{children}</div>;
}

/** Horizontal row laying out an avatar, name/handle, and trailing action. */
export function Header({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.header, className)}>{children}</div>;
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
				name: profile.displayName || profile.handle,
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

/** Stacked name + handle. */
export function NameAndHandle({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	return (
		<div className={css.nameAndHandle}>
			<Handle profile={profile} />
			<Name moderationOpts={moderationOpts} profile={profile} />
		</div>
	);
}

export function Name({
	color = 'textContrastMedium',
	moderationOpts,
	profile,
	size = 'md_sub',
	weight = 'normal',
}: {
	color?: 'text' | 'textContrastMedium';
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	size?: 'md_sub' | 'lg';
	weight?: 'normal' | 'semiBold';
}) {
	const moderation = moderateProfile(profile, moderationOpts);
	const name = sanitizeDisplayName(
		profile.displayName || profile.handle,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<Text numberOfLines={1} color={color} size={size} weight={weight}>
			{name}
		</Text>
	);
}

export function Handle({ profile }: { profile: AnyProfileView }) {
	const handle = profile.handle;
	return (
		<div className={css.handleRow}>
			<Text className={css.handleText} color="textContrastHigh" weight="semiBold" numberOfLines={1}>
				{handle}
			</Text>

			<div className={css.badges}>
				<ProfileBadges profile={profile} size="md" />
			</div>
		</div>
	);
}

/** Skeleton circle standing in for an avatar while a profile loads. */
export function AvatarPlaceholder({ size = 40 }: { size?: number }) {
	return <Skeleton.Circle size={size} />;
}

/** Skeleton bars standing in for the name column while a profile loads */
export function NameAndHandlePlaceholder() {
	return (
		<Skeleton.Col>
			<Skeleton.Text size="md" width="20%" />
			<Skeleton.Text size="md_sub" width="25%" />
		</Skeleton.Col>
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
		<RichText
			align={align}
			color={color}
			disableLinks
			numberOfLines={numberOfLines}
			size={size}
			value={profile.description}
		/>
	);
}

// weighted bio-line counts: most profiles carry a short bio, clustering around 1–2 lines with a tail toward
// 3 and a few empty. index = line count (0–3).
const DESCRIPTION_LINE_WEIGHTS = [3, 8, 6, 3];

function LoadingRow({ descriptionLines, topBorder }: { descriptionLines: number; topBorder: boolean }) {
	return (
		<div className={css.loadingRow({ topBorder })}>
			<Skeleton.Row align="center" gap="md">
				<AvatarPlaceholder />
				<NameAndHandlePlaceholder />
			</Skeleton.Row>
			{descriptionLines > 0 && <Skeleton.Lines count={descriptionLines} lastWidth={60} size="md" />}
		</div>
	);
}

// fallback row count when the caller doesn't know how many profiles to expect, and a cap so a large count
// doesn't render dozens of placeholder rows.
const DEFAULT_LOADING_ROW_COUNT = 3;
const MAX_LOADING_ROW_COUNT = 10;

/**
 * stack of profile-card placeholders for the loading state.
 *
 * @param count number of placeholder rows. capped to prevent excessive rendering.
 * @param topBorder whether the first row carries a top divider. defaults to `false`.
 */
export function LoadingPlaceholder({
	count,
	topBorder = false,
}: {
	count?: number;
	topBorder?: boolean;
}): ReactNode {
	const rowCount = Math.min(count ?? DEFAULT_LOADING_ROW_COUNT, MAX_LOADING_ROW_COUNT);
	const rows = Array.from({ length: rowCount }, () => ({
		descriptionLines: weightedIndex(DESCRIPTION_LINE_WEIGHTS),
	}));

	return (
		<>
			{rows.map((row, i) => (
				// oxlint-disable-next-line react/no-array-index-key -- static skeleton
				<LoadingRow descriptionLines={row.descriptionLines} key={i} topBorder={i === 0 ? topBorder : true} />
			))}
		</>
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

export type FollowButtonVariant = 'default' | 'text-only' | 'suggested' | 'subtle';

export type FollowButtonProps = {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	variant?: FollowButtonVariant;
};

/** Follow/unfollow toggle. Renders nothing for the signed-in user's own profile or when signed out. */
export function FollowButton(props: FollowButtonProps) {
	const { currentAccount, hasSession } = useSession();
	const isMe = props.profile.did === currentAccount?.did;
	return hasSession && !isMe ? <FollowButtonInner {...props} /> : null;
}

function FollowButtonInner({
	moderationOpts,
	profile: profileUnshadowed,
	variant = 'default',
}: FollowButtonProps) {
	const profile = useProfileShadow(profileUnshadowed);
	const moderation = moderateProfile(profile, moderationOpts);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);

	const isRound = variant === 'suggested';
	const followingWithIcon = variant !== 'text-only';
	const followWithIcon = variant !== 'text-only' && variant !== 'subtle';

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
		} catch (err) {
			if (!isAbortError(err)) {
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
			if (!isAbortError(err)) {
				Toast.show(m['common.error.generic'](), { type: 'error' });
			}
		}
	};

	const unfollowLabel = m['common.follow.action.following']();
	const followLabel = profile.viewer?.followedBy
		? m['common.follow.action.followBack']()
		: m['common.follow.action.follow']();

	if (!profile.viewer) {
		return null;
	}
	if (profile.viewer.blockedBy || profile.viewer.blocking || profile.viewer.blockingByList) {
		return null;
	}

	return profile.viewer.following ? (
		<Button
			label={unfollowLabel}
			size="small"
			variant={variant === 'subtle' ? 'ghost' : 'solid'}
			color="secondary"
			shape={isRound ? 'round' : 'default'}
			onClick={(e) => void onPressUnfollow(e)}
		>
			{followingWithIcon && <ButtonIcon icon={CheckIcon} />}
			{!isRound && <ButtonText>{unfollowLabel}</ButtonText>}
		</Button>
	) : (
		<Button
			label={followLabel}
			size="small"
			variant="solid"
			color={
				variant === 'suggested' ? 'secondary_inverted' : variant === 'subtle' ? 'primary_subtle' : 'primary'
			}
			shape={isRound ? 'round' : 'default'}
			onClick={(e) => void onPressFollow(e)}
		>
			{followWithIcon && <ButtonIcon icon={PlusIcon} />}
			{!isRound && <ButtonText>{followLabel}</ButtonText>}
		</Button>
	);
}
