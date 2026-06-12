import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { Person_Filled_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { UserAvatar } from '#/components/UserAvatar';

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

	// Drive the entrance scale from React state so the CSS transition (below) actually re-renders; the web
	// compat shim snaps shared values, so they can't drive the transition.
	const [animatedIn, setAnimatedIn] = useState(false);
	useEffect(() => {
		if (animate) {
			setAnimatedIn(true);
		}
	}, [animate]);

	const layouts = getLayouts(bubbleCount);

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
					/>
				))}
			</View>
		</View>
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
	const t = useTheme();
	const profile = useMaybeProfileShadow(profileUnshadowed);
	const moderationOpts = useModerationOpts();

	const transformStyle: WebViewStyle = {
		transform: [{ translateX: x }, { translateY: y }, { scale }],
	};
	if (transitionDelay != null) {
		// ease-out-back scale-in: the curve overshoots past the final scale, then settles back to it
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
