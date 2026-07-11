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
	border?: boolean;
	/** index into `profiles`; slots are authored in paint order, which need not match profile order. */
	index: number;
	size: number;
	x: number;
	y: number;
};

type Props = {
	animate?: boolean;
	profiles: AnyProfileView[];
	/** set to `true` to prevent filtering out the current user when there are more than two profiles */
	self?: boolean;
	size?: number;
	/**
	 * total number of members, used to determine the number of bubbles to render when it exceeds the number of
	 * available profiles. slots without a profile render as placeholders.
	 *
	 * @default profiles.length
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

	const [animatedIn, setAnimatedIn] = useState(false);
	useEffect(() => {
		if (animate) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot animation trigger
			setAnimatedIn(true);
		}
	}, [animate]);

	const layouts = getLayouts(bubbleCount);

	return (
		<svg className={css.svg} width={size} height={size} viewBox={getViewBox(layouts)}>
			{layouts.map((layout) => {
				const profile = profiles[layout.index];
				const border = layout.border ? 2 : 0;

				return (
					<foreignObject
						key={profile?.did ?? layout.index}
						x={layout.x}
						y={layout.y}
						width={layout.size + border * 2}
						height={layout.size + border * 2}
					>
						<AvatarBubble
							profile={profile}
							scale={animate ? (animatedIn ? 1 : 0) : 1}
							transitionDelay={animate ? 500 + layout.index * 100 : undefined}
							size={layout.size}
							includeProfileBorder={layout.border}
						/>
					</foreignObject>
				);
			})}
		</svg>
	);
}

function AvatarBubble({
	profile: profileUnshadowed,
	scale,
	transitionDelay,
	size,
	includeProfileBorder,
}: {
	profile?: AnyProfileView;
	scale: number;
	transitionDelay?: number;
	size: number;
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

// the layouts aren't symmetric about (60, 60), so center the cluster's bounding box in the 120-unit window.
function getViewBox(layouts: Layout[]): string {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const layout of layouts) {
		// bordered slots draw a 2px ring on every side.
		const outerSize = layout.size + (layout.border ? 4 : 0);
		minX = Math.min(minX, layout.x);
		minY = Math.min(minY, layout.y);
		maxX = Math.max(maxX, layout.x + outerSize);
		maxY = Math.max(maxY, layout.y + outerSize);
	}
	const offsetX = (minX + maxX) / 2 - 60;
	const offsetY = (minY + maxY) / 2 - 60;
	return `${offsetX} ${offsetY} 120 120`;
}

/** slots authored back-to-front so array order is the SVG paint order (later draws on top). */
function getLayouts(count: number): Layout[] {
	if (count === 3) {
		return [
			{ index: 0, size: 68, x: -2, y: -2 },
			{ index: 1, size: 56, x: 38, y: 62 },
			{ index: 2, size: 46, x: 71, y: 18 },
		];
	}
	if (count >= 4) {
		return [
			{ index: 0, size: 68, x: -2, y: -2 },
			{ index: 1, size: 56, x: 60, y: 49 },
			{ index: 2, size: 42, x: 14, y: 74 },
			{ index: 3, size: 32, x: 72, y: 9 },
		];
	}
	return [
		{ border: true, index: 1, size: 76, x: 42, y: 42 },
		{ border: true, index: 0, size: 76, x: -2, y: -2 },
	];
}
