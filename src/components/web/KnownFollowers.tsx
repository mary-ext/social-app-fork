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

import { AvatarStack } from '#/components/AvatarStack';
import { Text } from '#/components/Text';
import * as css from '#/components/web/KnownFollowers.css';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

/** avatar diameter per {@link KnownFollowersVariant}. */
const AVI_SIZE = { compact: 20, default: 30 } as const;

/** `'compact'` shrinks the avatars and tightens the row for dense contexts like message requests. */
type KnownFollowersVariant = 'compact' | 'default';

/**
 * Whether to render {@link KnownFollowers}. Counts the returned followers rather than the `count` field, since
 * `count` includes blocked users that `followers` omits.
 */
export function shouldShowKnownFollowers(knownFollowers?: AppBskyActorDefs.KnownFollowers) {
	return knownFollowers && knownFollowers.followers.length > 0;
}

/**
 * "Followed by X, Y and N others" — a row of overlapping avatars linking to the shared followers.
 *
 * @param showIfEmpty when there are no shared followers, render fallback text instead of nothing
 */
export function KnownFollowers({
	moderationOpts,
	profile,
	showIfEmpty,
	variant = 'default',
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	showIfEmpty?: boolean;
	variant?: KnownFollowersVariant;
}) {
	// stable per-instance Map; useConstant (not useRef) so reads/writes during render aren't ref accesses.
	const cache = useConstant(() => new Map<string, AppBskyActorDefs.KnownFollowers>());

	// `knownFollowers` isn't sorted stably, so revalidation can flash a reordered list. Cache the first
	// value seen for this profile so an in-memory screen keeps a stable order.
	if (profile.viewer?.knownFollowers && !cache.has(profile.did)) {
		cache.set(profile.did, profile.viewer.knownFollowers);
	}

	const cachedKnownFollowers = cache.get(profile.did);

	if (cachedKnownFollowers && shouldShowKnownFollowers(cachedKnownFollowers)) {
		return (
			<KnownFollowersInner
				cachedKnownFollowers={cachedKnownFollowers}
				moderationOpts={moderationOpts}
				profile={profile}
				showIfEmpty={showIfEmpty}
				variant={variant}
			/>
		);
	}

	return <EmptyFallback show={showIfEmpty} />;
}

function KnownFollowersInner({
	cachedKnownFollowers,
	moderationOpts,
	profile,
	showIfEmpty,
	variant,
}: {
	cachedKnownFollowers: AppBskyActorDefs.KnownFollowers;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	showIfEmpty?: boolean;
	variant: KnownFollowersVariant;
}) {
	const slice = cachedKnownFollowers.followers.slice(0, 3).map((f) => {
		const moderation = moderateProfile(f, moderationOpts);
		return {
			moderation,
			profile: {
				...f,
				displayName: sanitizeDisplayName(
					f.displayName || f.handle,
					getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
				),
			},
		};
	});

	// Does not have blocks applied. Always >= slice.length
	const serverCount = cachedKnownFollowers.count;

	if (slice.length === 0) {
		return <EmptyFallback show={showIfEmpty} />;
	}

	return (
		<Link
			className={css.link({ variant })}
			label={m['common.follow.a11y.knownFollowers']()}
			to={makeProfileLink(profile, 'known-followers')}
		>
			<AvatarStack
				moderationOpts={moderationOpts}
				profiles={slice.map(({ profile: prof }) => prof)}
				size={AVI_SIZE[variant]}
			/>

			<Text className={css.text} color="textContrastMedium" numberOfLines={2} size="sm">
				{slice.length >= 2 ? (
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
									<Text color="textContrastMedium" size="sm">
										{children}
									</Text>
								),
								t1: ({ children }) => (
									<Text color="textContrastMedium" size="sm">
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
									<Text color="textContrastMedium" size="sm">
										{children}
									</Text>
								),
								t1: ({ children }) => (
									<Text color="textContrastMedium" size="sm">
										{children}
									</Text>
								),
							}}
						/>
					)
				) : serverCount > 1 ? (
					<Trans
						message={m['common.follow.followedByOthers']}
						inputs={{ count: serverCount - 1, name: slice[0]!.profile.displayName }}
						markup={{
							t0: ({ children }) => (
								<Text color="textContrastMedium" size="sm">
									{children}
								</Text>
							),
						}}
					/>
				) : (
					<Trans
						message={m['common.follow.followedBy']}
						inputs={{ name: slice[0]!.profile.displayName }}
						markup={{
							t0: ({ children }) => (
								<Text color="textContrastMedium" size="sm">
									{children}
								</Text>
							),
						}}
					/>
				)}
			</Text>
		</Link>
	);
}

function EmptyFallback({ show }: { show?: boolean }) {
	if (!show) {
		return null;
	}

	return (
		<Text color="textContrastMedium" size="sm">
			{m['common.follow.knownFollowers.empty']()}
		</Text>
	);
}
