import type { ReactNode } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { ProfileBadges } from '#/components/ProfileBadges';
import * as css from '#/components/web/ProfileCard.css';
import { Text } from '#/components/web/Text';
import { PreviewableUserAvatar, UserAvatar } from '#/components/web/UserAvatar';

import { useActorStatus } from '#/features/liveNow';

/** Horizontal row laying out an avatar, name/handle, and trailing action. */
export function Header({ children }: { children: ReactNode }) {
	return <div className={css.header}>{children}</div>;
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
			<Text className={css.inlineName} leading="tight" numberOfLines={1} weight="semiBold">
				{forceLTR(name)}
			</Text>
			<div className={css.inlineBadges}>
				<ProfileBadges profile={profile} size="md" />
			</div>
			<Text className={css.inlineHandle} color="textContrastMedium" leading="tight" numberOfLines={1}>
				{NON_BREAKING_SPACE + handle}
			</Text>
		</div>
	);
}

/** Display name with trailing verification/badge cluster. */
export function Name({
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
	return (
		<div className={css.nameRow}>
			<Text className={css.nameText} numberOfLines={1} size="md" weight="semiBold">
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
