import type { MouseEvent, ReactNode } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { getModerationCauseKey } from '#/lib/moderation';
import { weightedRandomIndex } from '#/lib/numbers';
import { makeProfileLink } from '#/lib/routes/links';
import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { BlockLink } from '#/components/BlockLink';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { ProfileBadges } from '#/components/ProfileBadges';
import { RichText, type RichTextProps } from '#/components/RichText';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { PreviewableUserAvatar, UserAvatar } from '#/components/UserAvatar';
import { Button, type ButtonProps, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Pills from '#/components/web/Pills';
import * as css from '#/components/web/ProfileCard.css';
import * as Skeleton from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';

/**
 * The default profile-card presentation: a padded, full-width row laying out the avatar, name/handle, and a
 * trailing follow button, then moderation labels and the bio. Highlights on hover/press, with a hairline top
 * separator on by default. Compose the primitives directly for non-default layouts (a custom trailing action,
 * a dialog row).
 *
 * @param descriptionLines max bio lines before truncation.
 * @param followButtonProps overrides forwarded to the trailing {@link FollowButton} (e.g. `withIcon: false`).
 * @param showLabels whether to render the moderation/follows-you {@link Labels} row.
 * @param topBorder whether the row carries a top divider; turn it off for the first row beneath a header.
 */
export function Default({
	className,
	descriptionLines = 3,
	followButtonProps,
	moderationOpts,
	onPress,
	profile,
	showLabels = true,
	topBorder,
}: {
	className?: string;
	descriptionLines?: number;
	followButtonProps?: Partial<Omit<FollowButtonProps, 'moderationOpts' | 'profile'>>;
	moderationOpts: ModerationOptions;
	onPress?: () => void;
	profile: AnyProfileView;
	showLabels?: boolean;
	topBorder?: boolean;
}) {
	return (
		<Link className={clsx(css.defaultRow({ topBorder }), className)} onPress={onPress} profile={profile}>
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
			<Handle profile={profile} />
			<Name moderationOpts={moderationOpts} profile={profile} />
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
		profile.displayName || profile.handle,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);
	const handle = `@${profile.handle}`;
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

export function Handle({
	profile,
	weight = 'semiBold',
}: {
	profile: AnyProfileView;
	weight?: 'normal' | 'semiBold';
}) {
	const handle = profile.handle;
	return (
		<div className={css.handleRow}>
			<Text className={css.handleText} color="textContrastHigh" weight={weight} numberOfLines={1}>
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
 * A stack of profile-card placeholders for the loading state, mirroring {@link Default}'s layout (avatar,
 * name/handle, bio) so it sits on the same rhythm as the real cards.
 *
 * @param count number of placeholder rows; defaults to a small value and is capped so large counts don't
 *   render excessive rows.
 * @param topBorder whether the first row carries a top divider (later rows always do); set it when the
 *   placeholder sits directly beneath a borderless header. Defaults to `false`.
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
		descriptionLines: weightedRandomIndex(DESCRIPTION_LINE_WEIGHTS),
	}));

	return (
		<>
			{rows.map((row, i) => (
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
