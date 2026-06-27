import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { boostInterests, popularInterests, useInterestsDisplayNames } from '#/lib/interests';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { InterestTabs } from '#/components/web/InterestTabs';
import * as ProfileCard from '#/components/web/ProfileCard';

import * as css from './ExploreSuggestedAccounts.css';

export function SuggestedAccountsTabBar({
	defaultTabLabel,
	hideDefaultTab,
	onSelectInterest,
	selectedInterest,
}: {
	defaultTabLabel?: string;
	hideDefaultTab?: boolean;
	onSelectInterest: (interest: string | null) => void;
	selectedInterest: string | null;
}) {
	const { t: l } = useLingui();
	const interestsDisplayNames = useInterestsDisplayNames();
	const { data: preferences } = usePreferencesQuery();
	const personalizedInterests = preferences?.interests?.tags;
	const interests = Object.keys(interestsDisplayNames)
		.sort(boostInterests(popularInterests))
		.sort(boostInterests(personalizedInterests));

	return (
		<InterestTabs
			interests={hideDefaultTab ? interests : ['all', ...interests]}
			interestsDisplayNames={
				hideDefaultTab
					? interestsDisplayNames
					: {
							all: defaultTabLabel || l`For You`,
							...interestsDisplayNames,
						}
			}
			onSelectTab={(tab) => {
				onSelectInterest(tab === 'all' ? null : tab);
			}}
			selectedInterest={selectedInterest || (hideDefaultTab ? interests[0]! : 'all')}
		/>
	);
}

/** Profile card for suggested accounts. Note: border is on the top edge. */
export function SuggestedProfileCard({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	return (
		<ProfileCard.Link className={css.card} profile={profile}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar moderationOpts={moderationOpts} profile={profile} />
					<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
					<ProfileCard.FollowButton moderationOpts={moderationOpts} profile={profile} withIcon={false} />
				</ProfileCard.Header>
				<ProfileCard.Description numberOfLines={2} profile={profile} />
			</ProfileCard.Outer>
		</ProfileCard.Link>
	);
}
