import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import type { ActorIdentifier } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';
import { getModerationCauseKey } from '#/lib/moderation/causes';
import { profileTarget } from '#/lib/routes/targets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

import { LiveStatus } from '#/features/liveNow/components/LiveStatusDialog';
import { useActorStatus } from '#/features/liveNow/use-actor-status';

import { ProfileHeaderHandle } from '#/screens/Profile/Header/Handle';

import { useFollowMethods } from '#/components/hooks/useFollowMethods';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { KnownFollowers, shouldShowKnownFollowers } from '#/components/web/KnownFollowers';
import { InlineLinkText, Link, LinkButton } from '#/components/web/Link';
import * as Pills from '#/components/web/Pills';
import * as ProfileCard from '#/components/web/ProfileCard';

import Check from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import Plus from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './ProfileHoverCard.css';

export function Card({ actor }: { actor: ActorIdentifier }) {
	const router = useRouter();
	const resolvedDid = useResolveDidQuery(actor);
	const profile = useProfileQuery({ did: resolvedDid.data });
	const moderationOpts = useModerationOpts();
	const data = profile.data;
	const status = useActorStatus(data);

	const onPressOpenProfile = () => {
		if (!status.isActive || !data) {
			return;
		}
		router.navigate({ to: profileTarget(data.did) });
	};

	if (data && moderationOpts) {
		if (status.isActive && status.embed) {
			return (
				<div className={css.liveCard}>
					<LiveStatus
						embed={status.embed}
						onPressOpenProfile={onPressOpenProfile}
						padding="lg"
						profile={data}
						status={status}
					/>
				</div>
			);
		}
		return <Inner moderationOpts={moderationOpts} profile={data} />;
	}

	if (resolvedDid.error || profile.error) {
		return (
			<div className={css.errorCard}>
				<Text size="md" weight="semiBold">
					{resolvedDid.error ? m['common.error.oops']() : m['common.error.notFound']()}
				</Text>
				<Text color="textContrastMedium" size="sm">
					{cleanError(resolvedDid.error ?? profile.error)}
				</Text>
			</div>
		);
	}

	return (
		<div className={css.loadingCard}>
			<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
		</div>
	);
}

function Inner({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const { currentAccount } = useSession();
	const moderation = moderateProfile(profile, moderationOpts);
	const profileShadow = useProfileShadow(profile);
	const { follow, unfollow } = useFollowMethods({
		profile: profileShadow,
	});
	const isBlockedUser =
		profile.viewer?.blocking || profile.viewer?.blockedBy || profile.viewer?.blockingByList;
	const followsCount = profile.followsCount || 0;
	const followersCount = profile.followersCount || 0;
	const target = profileTarget(profile.did);
	const isMe = currentAccount?.did === profile.did;
	const isLabeler = profile.associated?.labeler;
	const isFollowing = profileShadow.viewer?.following;

	return (
		<div className={css.profileCard}>
			<div className={css.headerRow}>
				<Link className={css.avatarLink} label={m['common.profile.action.view']()} to={target}>
					<UserAvatar
						avatar={profile.avatar}
						moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
						size={64}
						type={isLabeler ? 'labeler' : 'user'}
					/>
				</Link>

				{!isMe &&
					!isLabeler &&
					(isBlockedUser ? (
						<LinkButton
							color="secondary"
							label={m['common.profile.a11y.viewBlocked']()}
							size="small"
							to={target}
							variant="solid"
						>
							<ButtonText>{m['common.profile.action.view']()}</ButtonText>
						</LinkButton>
					) : (
						<Button
							color={isFollowing ? 'secondary' : 'primary'}
							label={isFollowing ? m['common.follow.action.following']() : m['common.follow.action.follow']()}
							onClick={isFollowing ? unfollow : follow}
							size="small"
							variant="solid"
						>
							<ButtonIcon icon={isFollowing ? Check : Plus} />
							<ButtonText>
								{isFollowing ? m['common.follow.action.following']() : m['common.follow.action.follow']()}
							</ButtonText>
						</Button>
					))}
			</div>

			<Link className={css.nameLink} label={m['common.profile.action.view']()} to={target}>
				<ProfileCard.Name
					moderationOpts={moderationOpts}
					profile={profile}
					color="text"
					size="lg"
					weight="semiBold"
				/>
				<ProfileHeaderHandle disableTaps profile={profileShadow} />
			</Link>

			{isBlockedUser ? (
				<div className={css.pills}>
					{getDisplayRestrictions(moderation, DisplayContext.ProfileView).alerts.map((cause) => (
						<Pills.Label cause={cause} disableDetailsDialog key={getModerationCauseKey(cause)} size="lg" />
					))}
				</div>
			) : (
				<>
					<div className={css.statsRow}>
						<InlineLinkText
							color="text"
							label={m['common.follow.followersCount']({
								count: followersCount,
								formatted: formatCount(followersCount),
							})}
							to={{ name: 'ProfileFollowers', actor: profile.did }}
						>
							<Text color="textContrastMedium" size="md">
								<Trans
									inputs={{ count: followersCount, formatted: formatCount(followersCount) }}
									markup={{
										t0: ({ children }) => (
											<Text color="text" size="md" weight="semiBold">
												{children}
											</Text>
										),
									}}
									message={m['view.profile.followers.followersCount']}
								/>
							</Text>
						</InlineLinkText>
						<InlineLinkText
							color="text"
							label={m['common.follow.followingCount']({ formatted: formatCount(followsCount) })}
							to={{ name: 'ProfileFollows', actor: profile.did }}
						>
							<Text color="textContrastMedium" size="md">
								<Trans
									inputs={{ count: followsCount, formatted: formatCount(followsCount) }}
									markup={{
										t0: ({ children }) => (
											<Text color="text" size="md" weight="semiBold">
												{children}
											</Text>
										),
									}}
									message={m['view.profile.followers.followingCount']}
								/>
							</Text>
						</InlineLinkText>
					</div>

					{profile.description?.trim() &&
					getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length === 0 ? (
						<div className={css.description}>
							<RichText disableHoverCards numberOfLines={8} value={profile.description} />
						</div>
					) : undefined}

					{!isMe && shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
						<div className={css.knownFollowers}>
							<KnownFollowers moderationOpts={moderationOpts} profile={profile} />
						</div>
					)}
				</>
			)}
		</div>
	);
}
