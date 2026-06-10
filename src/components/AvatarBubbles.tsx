import { useEffect, useMemo, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	type DisplayRestrictions,
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { Person_Filled_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { UserAvatar } from '#/components/web/UserAvatar';

type WebViewStyle = ViewStyle & {
	transition?: string;
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

type Layout = {
	size: number;
	x: number;
	y: number;
	zIndex?: number;
	border?: boolean;
};

type Props = {
	animate?: boolean;
	profiles: (AnyProfileView | undefined)[];
	/**
	 * By default, when there are more than 2 profiles, the current user is filtered out (so you don't see
	 * yourself among your own group's members). Set this to `true` for cases where every passed profile should
	 * appear, e.g. an invite preview where the owner is meaningful regardless of viewer.
	 */
	self?: boolean;
	size?: number;
	moderationOpts?: ModerationOptions;
};

export function AvatarBubbles({
	animate = false,
	profiles: allProfiles,
	self = false,
	size = 120,
	moderationOpts,
}: Props) {
	const { currentAccount } = useSession();
	const profiles =
		!self && allProfiles.length > 2
			? allProfiles.filter((p) => p?.did != null && p.did !== currentAccount?.did)
			: allProfiles;
	const moderations = useMemo(() => {
		if (!moderationOpts) return [];
		return profiles.map((p) => (p ? moderateProfile(p, moderationOpts) : undefined));
	}, [profiles, moderationOpts]);

	const scale = size / 120;
	const marginOffset = size < 120 ? -2 : 0;

	// Drive the entrance scale from React state so the CSS transition (below) actually re-renders.
	// Real reanimated animated this on the UI thread, but our web compat shim snaps shared values.
	const [animatedIn, setAnimatedIn] = useState(false);
	useEffect(() => {
		if (animate) {
			setAnimatedIn(true);
		}
	}, [animate]);

	const layouts = getLayouts(profiles.length);

	return (
		<View style={[a.p_2xs, { height: size, width: size }]}>
			<View
				style={{
					marginTop: marginOffset,
					marginLeft: marginOffset,
					transform: [{ scale }],
					transformOrigin: 'top left',
				}}
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
						moderation={
							moderations[i] ? getDisplayRestrictions(moderations[i], DisplayContext.ProfileMedia) : undefined
						}
					/>
				))}
			</View>
		</View>
	);
}

function AvatarBubble({
	profile,
	scale,
	transitionDelay,
	size,
	x,
	y,
	zIndex,
	includeProfileBorder,
	moderation,
}: {
	profile?: AnyProfileView;
	scale: number;
	transitionDelay?: number;
	size: number;
	x: number;
	y: number;
	zIndex?: number;
	includeProfileBorder?: boolean;
	moderation?: DisplayRestrictions;
}) {
	const t = useTheme();

	const transformStyle: WebViewStyle = {
		transform: [{ translateX: x }, { translateY: y }, { scale }],
	};
	if (transitionDelay != null) {
		// approximate upstream's Easing.out(Easing.back(1.75)) scale-in with the canonical ease-out-back curve
		transformStyle.transition = `transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1) ${transitionDelay}ms`;
	}

	return (
		<View
			style={[
				a.absolute,
				a.rounded_full,
				a.flex_grow_0,
				includeProfileBorder && {
					borderColor: t.atoms.text_inverted.color,
					borderWidth: 2,
				},
				zIndex != null && { zIndex },
				webViewStyle(transformStyle),
			]}
		>
			{profile ? (
				<UserAvatar
					avatar={profile.avatar}
					size={size}
					type="user"
					hideLiveBadge
					noBorder
					moderation={moderation}
				/>
			) : (
				<AvatarPlaceholder size={size} />
			)}
		</View>
	);
}

function AvatarPlaceholder({ size }: { size: number }) {
	const t = useTheme();

	return (
		<View
			style={[
				a.align_center,
				a.justify_center,
				a.rounded_full,
				t.atoms.bg_contrast_200,
				{ width: size, height: size },
			]}
		>
			<PersonIcon width={size * 0.5} height={size * 0.5} fill={t.atoms.text_inverted.color} />
		</View>
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
