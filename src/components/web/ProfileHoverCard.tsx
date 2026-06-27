import { type ReactElement, useRef } from 'react';
import type { AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { PreviewCard } from '@base-ui/react/preview-card';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { clsx } from 'clsx';

import { getModerationCauseKey } from '#/lib/moderation';
import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePrefetchProfileQuery, useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { formatCount } from '#/view/com/util/numeric/format';

import { ProfileHeaderHandle } from '#/screens/Profile/Header/Handle';

import { useFollowMethods } from '#/components/hooks/useFollowMethods';
import { useRichText } from '#/components/hooks/useRichText';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import * as Pills from '#/components/Pills';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { KnownFollowers, shouldShowKnownFollowers } from '#/components/web/KnownFollowers';
import { InlineLinkText, Link, LinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as css from '#/components/web/ProfileHoverCard.css';

import { useActorStatus } from '#/features/liveNow';
import { LiveStatus } from '#/features/liveNow/components/LiveStatus';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export type ProfileHoverCardProps = {
	/**
	 * The trigger element. Used directly as {@link PreviewCard.Trigger}'s `render`, so it must forward a ref
	 * and spread DOM props onto its host node (a plain `<div>`/`<a>`, `web/Link`, etc.).
	 */
	children: ReactElement;
	did: string;
};

/**
 * A profile preview shown on hover, built on Base UI's PreviewCard. Wraps a single ref-forwarding trigger.
 * Base UI only opens it via pointer hover, so it stays inert on touch devices; to drop the card entirely,
 * render the trigger directly instead of passing a flag.
 */
export function ProfileHoverCard({ children, did }: ProfileHoverCardProps) {
	const prefetchProfileQuery = usePrefetchProfileQuery();
	const prefetched = useRef(false);

	const prefetchIfNeeded = () => {
		if (!prefetched.current) {
			prefetched.current = true;
			void prefetchProfileQuery(did);
		}
	};

	return (
		<PreviewCard.Root>
			<PreviewCard.Trigger
				render={children}
				// closeDelay={HIDE_DELAY}
				// delay={SHOW_DELAY}
				// warm the cache as soon as the pointer lands so the card has data before the open delay elapses
				onPointerMove={prefetchIfNeeded}
			/>
			<PreviewCard.Portal>
				<PreviewCard.Positioner className={css.positioner} collisionPadding={16} sideOffset={4}>
					<PreviewCard.Popup className={css.popup}>
						<Card did={did} />
					</PreviewCard.Popup>
				</PreviewCard.Positioner>
			</PreviewCard.Portal>
		</PreviewCard.Root>
	);
}

function Card({ did }: { did: string }) {
	const navigation = useNavigation<NavigationProp>();
	const profile = useProfileQuery({ did });
	const moderationOpts = useModerationOpts();
	const data = profile.data;
	const status = useActorStatus(data);

	const onPressOpenProfile = () => {
		if (!status.isActive || !data) return;
		navigation.push('Profile', { name: data.did });
	};

	if (data && moderationOpts) {
		if (status.isActive) {
			return (
				<div className={clsx(css.card, css.cardLive)}>
					<LiveStatus
						embed={status.embed as AppBskyEmbedExternal.View}
						onPressOpenProfile={onPressOpenProfile}
						padding="lg"
						profile={data}
						status={status}
					/>
				</div>
			);
		}
		return (
			<div className={clsx(css.card, css.cardPadded)}>
				<Inner moderationOpts={moderationOpts} profile={data} />
			</div>
		);
	}

	return (
		<div className={clsx(css.card, css.loading)}>
			<Spinner color={colors.contrast_500} label={m['common.label.loading']()} size="xl" />
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
	const { i18n } = useLingui();
	const { currentAccount } = useSession();
	const moderation = moderateProfile(profile, moderationOpts);
	const [descriptionRT] = useRichText(profile.description ?? '');
	const profileShadow = useProfileShadow(profile);
	const { follow, unfollow } = useFollowMethods({
		profile: profileShadow,
	});
	const isBlockedUser =
		profile.viewer?.blocking || profile.viewer?.blockedBy || profile.viewer?.blockingByList;
	const following = formatCount(i18n, profile.followsCount || 0);
	const followers = formatCount(i18n, profile.followersCount || 0);
	const pluralizedFollowers = m['common.count.followers']({ count: profile.followersCount || 0 });
	const pluralizedFollowings = m['common.count.following']({ count: profile.followsCount || 0 });
	const profileURL = makeProfileLink({ did: profile.did });
	const isMe = currentAccount?.did === profile.did;
	const isLabeler = profile.associated?.labeler;
	const isFollowing = profileShadow.viewer?.following;

	return (
		<div>
			<div className={css.headerRow}>
				<Link className={css.avatarLink} label={m['common.action.viewProfile']()} to={profileURL}>
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
							label={m['common.a11y.viewBlockedProfile']()}
							size="small"
							to={profileURL}
							variant="solid"
						>
							<ButtonText>{m['common.action.viewProfile']()}</ButtonText>
						</LinkButton>
					) : (
						<Button
							color={isFollowing ? 'secondary' : 'primary'}
							label={isFollowing ? m['common.action.following']() : m['common.action.follow']()}
							onClick={isFollowing ? unfollow : follow}
							size="small"
							variant="solid"
						>
							<ButtonIcon icon={isFollowing ? Check : Plus} />
							<ButtonText>
								{isFollowing ? m['common.action.following']() : m['common.action.follow']()}
							</ButtonText>
						</Button>
					))}
			</div>

			<Link className={css.nameLink} label={m['common.action.viewProfile']()} to={profileURL}>
				<ProfileCard.Name moderationOpts={moderationOpts} profile={profile} size="lg" />
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
							label={`${followers} ${pluralizedFollowers}`}
							to={makeProfileLink(profile, 'followers')}
						>
							<Text size="md" weight="semiBold">
								{followers}{' '}
							</Text>
							<Text color="textContrastMedium" size="md">
								{pluralizedFollowers}
							</Text>
						</InlineLinkText>
						<InlineLinkText
							color="text"
							label={m['common.label.followingCount']({ following })}
							to={makeProfileLink(profile, 'follows')}
						>
							<Text size="md" weight="semiBold">
								{following}{' '}
							</Text>
							<Text color="textContrastMedium" size="md">
								{pluralizedFollowings}
							</Text>
						</InlineLinkText>
					</div>

					{profile.description?.trim() &&
					getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length === 0 ? (
						<div className={css.description}>
							<RichText disableHoverCards numberOfLines={8} value={descriptionRT} />
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
