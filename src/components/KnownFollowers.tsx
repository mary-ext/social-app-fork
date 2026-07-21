import { View } from 'react-native';

import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useConstant } from '#/lib/hooks/use-constant';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { Trans } from '#/locale/Trans';

import { atoms as a, useTheme } from '#/alf';

import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

const AVI_SIZE = 30;
const AVI_SIZE_SMALL = 20;
const AVI_BORDER = 1;

/**
 * determines if `KnownFollowers` should be shown by checking the number of returned users instead of the
 * `count` value
 */
export function shouldShowKnownFollowers(knownFollowers?: AppBskyActorDefs.KnownFollowers) {
	return knownFollowers && knownFollowers.followers.length > 0;
}

export function KnownFollowers({
	profile,
	moderationOpts,
	minimal,
	showIfEmpty,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	minimal?: boolean;
	showIfEmpty?: boolean;
}) {
	// stable per-instance Map; useConstant (not useRef) so reads/writes during render aren't ref accesses.
	const cache = useConstant(() => new Map<string, AppBskyActorDefs.KnownFollowers>());

	/*
	 * Results for `knownFollowers` are not sorted consistently, so when
	 * revalidating we can see a flash of this data updating. This cache prevents
	 * this happening for screens that remain in memory. When pushing a new
	 * screen, or once this one is popped, this cache is empty, so new data is
	 * displayed.
	 */
	if (profile.viewer?.knownFollowers && !cache.has(profile.did)) {
		cache.set(profile.did, profile.viewer.knownFollowers);
	}

	const cachedKnownFollowers = cache.get(profile.did);

	if (cachedKnownFollowers && shouldShowKnownFollowers(cachedKnownFollowers)) {
		return (
			<KnownFollowersInner
				profile={profile}
				cachedKnownFollowers={cachedKnownFollowers}
				moderationOpts={moderationOpts}
				minimal={minimal}
				showIfEmpty={showIfEmpty}
			/>
		);
	}

	return <EmptyFallback show={showIfEmpty} />;
}

function KnownFollowersInner({
	profile,
	moderationOpts,
	cachedKnownFollowers,
	minimal,
	showIfEmpty,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	cachedKnownFollowers: AppBskyActorDefs.KnownFollowers;
	minimal?: boolean;
	showIfEmpty?: boolean;
}) {
	const t = useTheme();
	const textStyle = [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium];

	const slice = cachedKnownFollowers.followers.slice(0, 3).map((f) => {
		const moderation = moderateProfile(f, moderationOpts);
		return {
			profile: {
				...f,
				displayName: sanitizeDisplayName(
					f.displayName || f.handle,
					getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
				),
			},
			moderation,
		};
	});

	// Does not have blocks applied. Always >= slices.length
	const serverCount = cachedKnownFollowers.count;

	/*
	 * We check above too, but here for clarity and a reminder to _check for
	 * valid indices_
	 */
	if (slice.length === 0) {
		return <EmptyFallback show={showIfEmpty} />;
	}

	const SIZE = minimal ? AVI_SIZE_SMALL : AVI_SIZE;

	return (
		<Link
			label={m['common.follow.a11y.knownFollowers']()}
			to={makeProfileLink(profile, 'known-followers')}
			style={[
				a.max_w_full,
				a.flex_row,
				minimal ? a.gap_sm : a.gap_md,
				a.align_center,
				{ marginLeft: -AVI_BORDER },
			]}
		>
			{({ hovered, pressed }) => (
				<>
					<View
						style={[
							a.flex_row,
							{
								height: SIZE,
							},
							pressed && {
								opacity: 0.5,
							},
						]}
					>
						{slice.map(({ profile: prof, moderation }, i) => (
							<View
								key={prof.did}
								style={[
									a.rounded_full,
									{
										borderWidth: AVI_BORDER,
										borderColor: t.atoms.bg.backgroundColor,
										width: SIZE + AVI_BORDER * 2,
										height: SIZE + AVI_BORDER * 2,
										zIndex: AVI_BORDER - i,
										marginLeft: i > 0 ? -8 : 0,
									},
								]}
							>
								<UserAvatar
									size={SIZE}
									avatar={prof.avatar}
									moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
									type={prof.associated?.labeler ? 'labeler' : 'user'}
									noBorder
								/>
							</View>
						))}
					</View>

					<Text
						style={[
							a.flex_shrink,
							textStyle,
							hovered && {
								textDecorationLine: 'underline',
								textDecorationColor: t.atoms.text_contrast_medium.color,
							},
							pressed && {
								opacity: 0.5,
							},
						]}
						numberOfLines={2}
					>
						{slice.length >= 2 ? (
							// 2-n followers, including blocks
							// only 2
							serverCount > 2 ? (
								<Trans
									message={m['common.follow.followedByMany']}
									inputs={{
										count: serverCount - 2,
										name: slice[0]!.profile.displayName,
										name2: slice[1]!.profile.displayName,
									}}
									markup={{
										t0: ({ children }) => (
											<Text emoji style={textStyle}>
												{children}
											</Text>
										),
										t1: ({ children }) => (
											<Text emoji style={textStyle}>
												{children}
											</Text>
										),
									}}
								/>
							) : (
								<Trans
									message={m['common.follow.followedByTwo']}
									inputs={{
										name: slice[0]!.profile.displayName,
										name2: slice[1]!.profile.displayName,
									}}
									markup={{
										t0: ({ children }) => (
											<Text emoji style={textStyle}>
												{children}
											</Text>
										),
										t1: ({ children }) => (
											<Text emoji style={textStyle}>
												{children}
											</Text>
										),
									}}
								/>
							)
						) : serverCount > 1 ? (
							// 1-n followers, including blocks
							<Trans
								message={m['common.follow.followedByOthers']}
								inputs={{
									count: serverCount - 1,
									name: slice[0]!.profile.displayName,
								}}
								markup={{
									t0: ({ children }) => (
										<Text emoji style={textStyle}>
											{children}
										</Text>
									),
								}}
							/>
						) : (
							// only 1
							<Trans
								message={m['common.follow.followedBy']}
								inputs={{ name: slice[0]!.profile.displayName }}
								markup={{
									t0: ({ children }) => (
										<Text emoji style={textStyle}>
											{children}
										</Text>
									),
								}}
							/>
						)}
					</Text>
				</>
			)}
		</Link>
	);
}

function EmptyFallback({ show }: { show?: boolean }) {
	const t = useTheme();

	if (!show) {
		return null;
	}

	return (
		<Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
			{m['common.follow.knownFollowers.empty']()}
		</Text>
	);
}
