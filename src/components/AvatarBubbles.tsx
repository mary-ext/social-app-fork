import { useEffect, useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { Person_Filled_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { UserAvatar } from '#/components/UserAvatar';

import * as css from './AvatarBubbles.css';

type Layout = {
	size: number;
	x: number;
	y: number;
	zIndex?: number;
	border?: boolean;
};

type Props = {
	animate?: boolean;
	profiles: AnyProfileView[];
	/**
	 * By default, when there are more than 2 profiles, the current user is filtered out (so you don't see
	 * yourself among your own group's members). Set this to `true` for cases where every passed profile should
	 * appear, e.g. an invite preview where the owner is meaningful regardless of viewer.
	 */
	self?: boolean;
	size?: number;
	/**
	 * The true number of members, used to decide how many bubbles to render when it exceeds the number of
	 * `profiles` we have on hand (e.g. an invite preview that only carries a few member profiles for a much
	 * larger group). Slots without a profile render as placeholders. Defaults to `profiles.length`.
	 */
	count?: number;
};

export function AvatarBubbles({
	animate = false,
	profiles: allProfiles,
	self = false,
	size = 120,
	count,
}: Props) {
	const { currentAccount } = useSession();
	const profiles =
		!self && allProfiles.length > 2 ? allProfiles.filter((p) => p.did !== currentAccount?.did) : allProfiles;

	const bubbleCount = Math.max(profiles.length, count ?? 0);

	const scale = size / 120;
	const marginOffset = size < 120 ? -2 : 0;

	// Drive the entrance scale from React state so the CSS transition actually re-renders into its end state.
	const [animatedIn, setAnimatedIn] = useState(false);
	useEffect(() => {
		if (animate) {
			setAnimatedIn(true);
		}
	}, [animate]);

	const layouts = getLayouts(bubbleCount);

	return (
		<div className={css.outer} style={assignInlineVars({ [css.containerSizeVar]: `${size}px` })}>
			<div
				className={css.inner}
				style={assignInlineVars({
					[css.innerOffsetVar]: `${marginOffset}px`,
					[css.innerScaleVar]: String(scale),
				})}
			>
				{layouts.map((layout, i) => (
					<AvatarBubble
						key={i}
						profile={profiles[i]}
						scale={animate ? (animatedIn ? 1 : 0) : 1}
						transitionDelay={animate ? 500 + i * 100 : undefined}
						size={layout.size}
						x={layout.x}
						y={layout.y}
						zIndex={layout.zIndex}
						includeProfileBorder={layout.border}
					/>
				))}
			</div>
		</div>
	);
}

function AvatarBubble({
	profile: profileUnshadowed,
	scale,
	transitionDelay,
	size,
	x,
	y,
	zIndex,
	includeProfileBorder,
}: {
	profile?: AnyProfileView;
	scale: number;
	transitionDelay?: number;
	size: number;
	x: number;
	y: number;
	zIndex?: number;
	includeProfileBorder?: boolean;
}) {
	const profile = useMaybeProfileShadow(profileUnshadowed);
	const moderationOpts = useModerationOpts();

	return (
		<div
			className={clsx(
				css.bubble,
				includeProfileBorder && css.bubbleBorder,
				transitionDelay != null && css.bubbleAnimated,
			)}
			style={assignInlineVars({
				[css.bubbleDelayVar]: transitionDelay != null ? `${transitionDelay}ms` : '0ms',
				[css.bubbleScaleVar]: String(scale),
				[css.bubbleXVar]: `${x}px`,
				[css.bubbleYVar]: `${y}px`,
				[css.bubbleZIndexVar]: zIndex != null ? String(zIndex) : 'auto',
			})}
		>
			{profile && moderationOpts ? (
				<UserAvatar
					avatar={profile.avatar}
					size={size}
					type="user"
					hideLiveBadge
					noBorder
					moderation={getDisplayRestrictions(
						moderateProfile(profile, moderationOpts),
						DisplayContext.ProfileMedia,
					)}
				/>
			) : (
				<AvatarPlaceholder size={size} />
			)}
		</div>
	);
}

function AvatarPlaceholder({ size }: { size: number }) {
	return (
		<div className={css.placeholder} style={assignInlineVars({ [css.placeholderSizeVar]: `${size}px` })}>
			<PersonIcon width={size * 0.5} fill="currentColor" />
		</div>
	);
}

function getLayouts(count: number): Layout[] {
	if (count === 3) {
		return [
			{ size: 68, x: -2, y: -2 },
			{ size: 56, x: 38, y: 62 },
			{ size: 46, x: 71, y: 18 },
		];
	}
	if (count >= 4) {
		return [
			{ size: 68, x: -2, y: -2 },
			{ size: 56, x: 60, y: 49 },
			{ size: 42, x: 14, y: 74 },
			{ size: 32, x: 72, y: 9 },
		];
	}
	return [
		{ size: 76, x: -2, y: -2, zIndex: 20, border: true },
		{ size: 76, x: 42, y: 42, zIndex: 10, border: true },
	];
}
