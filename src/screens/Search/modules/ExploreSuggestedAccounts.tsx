import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { boostInterests, popularInterests, useInterestsDisplayNames } from '#/lib/interests';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { InterestTabs } from '#/components/InterestTabs';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

export function SuggestedAccountsTabBar({
	onSelectInterest,
	selectedInterest,
}: {
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
			interests={['all', ...interests]}
			interestsDisplayNames={{
				all: m['common.feeds.forYou'](),
				...interestsDisplayNames,
			}}
			onSelectTab={(tab) => {
				onSelectInterest(tab === 'all' ? null : tab);
			}}
			selectedInterest={selectedInterest || 'all'}
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
			followButtonProps={{ variant: 'text-only' }}
			moderationOpts={moderationOpts}
			profile={profile}
			showLabels={false}
		/>
	);
}
