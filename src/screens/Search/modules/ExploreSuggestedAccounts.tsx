import { memo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { popularInterests, useInterestsDisplayNames } from '#/lib/interests';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { atoms as a, useTheme } from '#/alf';

import { boostInterests, InterestTabs } from '#/components/InterestTabs';
import * as ProfileCard from '#/components/ProfileCard';
import { SubtleHover } from '#/components/SubtleHover';

export function SuggestedAccountsTabBar({
	selectedInterest,
	onSelectInterest,
	hideDefaultTab,
	defaultTabLabel,
}: {
	selectedInterest: string | null;
	onSelectInterest: (interest: string | null) => void;
	hideDefaultTab?: boolean;
	defaultTabLabel?: string;
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
			selectedInterest={selectedInterest || (hideDefaultTab ? interests[0]! : 'all')}
			onSelectTab={(tab) => {
				onSelectInterest(tab === 'all' ? null : tab);
			}}
			interestsDisplayNames={
				hideDefaultTab
					? interestsDisplayNames
					: {
							all: defaultTabLabel || l`For You`,
							...interestsDisplayNames,
						}
			}
		/>
	);
}

/** Profile card for suggested accounts. Note: border is on the bottom edge */
let SuggestedProfileCard = ({
	profile,
	moderationOpts,
	recId: _recId,
	position: _position,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	recId?: string;
	position: number;
}): React.ReactNode => {
	const t = useTheme();
	return (
		<ProfileCard.Link profile={profile} style={[a.flex_1]} onPress={() => {}}>
			{(s) => (
				<>
					<SubtleHover hover={s.hovered || s.pressed} />
					<View style={[a.flex_1, a.w_full, a.py_lg, a.px_lg, a.border_t, t.atoms.border_contrast_low]}>
						<ProfileCard.Outer>
							<ProfileCard.Header>
								<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
								<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
								<ProfileCard.FollowButton
									profile={profile}
									moderationOpts={moderationOpts}
									withIcon={false}
									onFollow={() => {}}
								/>
							</ProfileCard.Header>
							<ProfileCard.Description profile={profile} numberOfLines={2} />
						</ProfileCard.Outer>
					</View>
				</>
			)}
		</ProfileCard.Link>
	);
};
SuggestedProfileCard = memo(SuggestedProfileCard);
export { SuggestedProfileCard };
