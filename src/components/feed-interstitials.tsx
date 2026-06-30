import { useEffect, useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useSuggestedFollowsByActorWithDismiss } from '#/state/queries/suggested-follows';
import { useGetSuggestedUsersForDiscoverQuery } from '#/state/queries/trending/useGetSuggestedUsersForDiscoverQuery';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { BlockLink } from '#/components/BlockLink';
import * as css from '#/components/feed-interstitials.css';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { ProfileBadges } from '#/components/ProfileBadges';
import { SuggestedFollowsDialog } from '#/components/suggested-follows-dialog';
import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';

function SuggestedFollowPlaceholder() {
	return (
		<div className={css.cardBase}>
			<div className={css.body}>
				<ProfileCard.AvatarPlaceholder size={88} />
				<div className={css.identity}>
					<Skeleton.Text size="md" width="60%" />
					<div className={css.description}>
						<Skeleton.Lines blend={false} count={2} lastWidth={60} size="sm" />
					</div>
				</div>
			</div>
			<div className={css.followPlaceholder} />
		</div>
	);
}

function SuggestedFollowCard({
	moderationOpts,
	onDismiss,
	profile,
}: {
	moderationOpts: ModerationOptions;
	onDismiss?: (did: string) => void;
	profile: AnyProfileView;
}) {
	return (
		<BlockLink
			className={clsx(css.cardBase, css.cardLink)}
			label={m['common.profile.a11y.viewNamed']({
				name: profile.displayName || sanitizeHandle(profile.handle),
			})}
			to={makeProfileLink({ did: profile.did })}
		>
			<div>
				{onDismiss && (
					<button
						aria-label={m['components.feedInterstitials.action.dismiss']()}
						className={css.dismiss}
						onClick={(e) => {
							e.stopPropagation();
							onDismiss(profile.did);
						}}
						type="button"
					>
						<XIcon fill="currentColor" size="xs" />
					</button>
				)}
				<div className={css.body}>
					<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} size={88} />
					<div className={css.identity}>
						<div className={css.nameRow}>
							<ProfileCard.Name
								color="text"
								moderationOpts={moderationOpts}
								profile={profile}
								size="lg"
								weight="semiBold"
							/>
							<div className={css.badges}>
								<ProfileBadges profile={profile} size="md" />
							</div>
						</div>
						<div className={css.description}>
							<ProfileCard.Description
								align="center"
								color="textContrastMedium"
								numberOfLines={2}
								profile={profile}
								size="sm"
							/>
						</div>
					</div>
				</div>
				<ProfileCard.FollowButton moderationOpts={moderationOpts} profile={profile} withIcon={false} />
			</div>
		</BlockLink>
	);
}

export function SuggestedFollows({ feed }: { feed: FeedDescriptor }) {
	const { currentAccount } = useSession();
	const [feedType, feedUriOrDid] = feed.split('|') as [string, string];
	if (feedType === 'author') {
		if (currentAccount?.did === feedUriOrDid) {
			return null;
		} else {
			return <SuggestedFollowsProfile did={feedUriOrDid} />;
		}
	} else {
		return <SuggestedFollowsHome />;
	}
}

export function SuggestedFollowsProfile({ did }: { did: string }) {
	const { profiles, onDismiss, isLoading, error } = useSuggestedFollowsByActorWithDismiss({ did });

	return (
		<ProfileGrid
			error={error}
			isSuggestionsLoading={isLoading}
			onDismiss={onDismiss}
			profiles={profiles}
			viewContext="profile"
		/>
	);
}

export function SuggestedFollowsHome() {
	const { isLoading, data, error } = useGetSuggestedUsersForDiscoverQuery();

	const [dismissedDids, setDismissedDids] = useState<Set<string>>(new Set());

	const onDismiss = (did: string) => {
		setDismissedDids((prev) => new Set(prev).add(did));
	};

	const allProfiles = data?.actors ?? [];
	const filteredProfiles = allProfiles.filter((p) => !dismissedDids.has(p.did));

	return (
		<ProfileGrid
			error={error}
			isSuggestionsLoading={isLoading}
			onDismiss={onDismiss}
			profiles={filteredProfiles}
			totalProfileCount={allProfiles.length}
			viewContext="feed"
		/>
	);
}

export function ProfileGrid({
	error,
	isSuggestionsLoading,
	onDismiss,
	onRequestHide,
	profiles,
	totalProfileCount,
	viewContext = 'feed',
}: {
	error: Error | null;
	isSuggestionsLoading: boolean;
	onDismiss?: (did: string) => void;
	onRequestHide?: () => void;
	profiles: AnyProfileView[];
	totalProfileCount?: number;
	viewContext: 'feed' | 'profile' | 'profileHeader';
}) {
	const moderationOpts = useModerationOpts();
	const followDialogHandle = Dialog.useDialogHandle();

	const isLoading = isSuggestionsLoading || !moderationOpts;
	const isProfileHeaderContext = viewContext === 'profileHeader';

	// the wide grid caps at a single row of 3; the phone scroller and the taller profile-header carousel show more.
	const maxLength = isProfileHeaderContext ? 12 : 6;
	const minLength = 3;

	const content = isLoading
		? Array(maxLength)
				.fill(0)
				.map((_, i) => <SuggestedFollowPlaceholder key={i} />)
		: error || !profiles.length
			? null
			: profiles
					.slice(0, maxLength)
					.map((profile) =>
						moderationOpts ? (
							<SuggestedFollowCard
								key={profile.did}
								moderationOpts={moderationOpts}
								onDismiss={onDismiss}
								profile={profile}
							/>
						) : null,
					);

	// use totalProfileCount (before dismissals) for the minLength check on initial render.
	const profileCountForMinCheck = totalProfileCount ?? profiles.length;

	useEffect(() => {
		if (error || (!isLoading && profileCountForMinCheck < minLength)) {
			onRequestHide?.();
		}
	}, [error, isLoading, onRequestHide, profileCountForMinCheck, minLength]);

	if (error || (!isLoading && profileCountForMinCheck < minLength)) {
		logger.debug(`Not enough profiles to show suggested follows`);
		return null;
	}

	return (
		<div className={css.section({ topBorder: !isProfileHeaderContext })}>
			<div className={css.header}>
				<Text size="md_sub" weight="semiBold">
					{m['components.feedInterstitials.title']()}
				</Text>

				<Dialog.Trigger
					aria-label={m['components.feedInterstitials.seeMoreA11y']()}
					className={css.seeMoreTrigger}
					handle={followDialogHandle}
				>
					<Text className={css.seeMoreText} color="primary_600" weight="semiBold" size="md_sub">
						{m['components.feedInterstitials.action.seeMore']()}
					</Text>
				</Dialog.Trigger>
			</div>
			<SuggestedFollowsDialog handle={followDialogHandle} />
			<div className={css.grid}>
				{content}
				<Dialog.Trigger
					aria-label={m['components.feedInterstitials.action.browseMore']()}
					className={css.seeMoreCard}
					handle={followDialogHandle}
				>
					<ArrowRightIcon fill="currentColor" size="lg" />
					<Text align="center" size="md" weight="medium">
						{m['components.feedInterstitials.action.seeMore']()}
					</Text>
				</Dialog.Trigger>
			</div>
		</div>
	);
}
