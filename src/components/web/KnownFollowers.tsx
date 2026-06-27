import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { Plural, Trans } from '@lingui/react/macro';

import { useConstant } from '#/lib/hooks/use-constant';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { Text } from '#/components/Text';
import { AvatarStack } from '#/components/web/AvatarStack';
import * as css from '#/components/web/KnownFollowers.css';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

const AVI_SIZE = 30;

/**
 * Whether to render {@link KnownFollowers}. Counts the returned followers rather than the `count` field, since
 * `count` includes blocked users that `followers` omits.
 */
export function shouldShowKnownFollowers(knownFollowers?: AppBskyActorDefs.KnownFollowers) {
	return knownFollowers && knownFollowers.followers.length > 0;
}

/** "Followed by X, Y and N others" — a row of overlapping avatars linking to the shared followers. */
export function KnownFollowers({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
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
			/>
		);
	}

	return null;
}

function KnownFollowersInner({
	cachedKnownFollowers,
	moderationOpts,
	profile,
}: {
	cachedKnownFollowers: AppBskyActorDefs.KnownFollowers;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
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
		return null;
	}

	return (
		<Link
			className={css.link}
			label={m['common.a11y.pressToViewKnownFollowers']()}
			to={makeProfileLink(profile, 'known-followers')}
		>
			<AvatarStack
				moderationOpts={moderationOpts}
				profiles={slice.map(({ profile: prof }) => prof)}
				size={AVI_SIZE}
			/>

			<Text className={css.text} color="textContrastMedium" numberOfLines={2} size="sm">
				{slice.length >= 2 ? (
					serverCount > 2 ? (
						<Trans>
							Followed by{' '}
							<Text key={slice[0]!.profile.did} color="textContrastMedium" size="sm">
								{slice[0]!.profile.displayName}
							</Text>
							,{' '}
							<Text key={slice[1]!.profile.did} color="textContrastMedium" size="sm">
								{slice[1]!.profile.displayName}
							</Text>
							, and <Plural value={serverCount - 2} one="# other" other="# others" />
						</Trans>
					) : (
						<Trans>
							Followed by{' '}
							<Text key={slice[0]!.profile.did} color="textContrastMedium" size="sm">
								{slice[0]!.profile.displayName}
							</Text>{' '}
							and{' '}
							<Text key={slice[1]!.profile.did} color="textContrastMedium" size="sm">
								{slice[1]!.profile.displayName}
							</Text>
						</Trans>
					)
				) : serverCount > 1 ? (
					<Trans>
						Followed by{' '}
						<Text key={slice[0]!.profile.did} color="textContrastMedium" size="sm">
							{slice[0]!.profile.displayName}
						</Text>{' '}
						and <Plural value={serverCount - 1} one="# other" other="# others" />
					</Trans>
				) : (
					<Trans>
						Followed by{' '}
						<Text key={slice[0]!.profile.did} color="textContrastMedium" size="sm">
							{slice[0]!.profile.displayName}
						</Text>
					</Trans>
				)}
			</Text>
		</Link>
	);
}
