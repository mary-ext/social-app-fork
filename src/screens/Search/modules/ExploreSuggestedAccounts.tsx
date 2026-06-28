import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { boostInterests, popularInterests, useInterestsDisplayNames } from '#/lib/interests';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { InterestTabs } from '#/components/web/InterestTabs';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

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
							all: defaultTabLabel || m['common.feeds.forYou'](),
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

/** Profile card for suggested accounts. */
export function SuggestedProfileCard({
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	return (
		<ProfileCard.Default
			descriptionLines={2}
			followButtonProps={{ withIcon: false }}
			moderationOpts={moderationOpts}
			profile={profile}
			showLabels={false}
		/>
	);
}
