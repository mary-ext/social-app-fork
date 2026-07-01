import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';

import { boostInterests, popularInterests, useInterestsDisplayNames } from '#/lib/interests';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useGetSuggestedUsersForSeeMoreQuery } from '#/state/queries/trending/useGetSuggestedUsersForSeeMoreQuery';
import { useSession } from '#/state/session';

import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as css from '#/components/suggested-follows-dialog.css';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { SearchInput } from '#/components/web/forms/SearchInput';
import { InterestTabs } from '#/components/web/InterestTabs';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

const FOR_YOU_TAB = 'all';

// persisted across opens so reopening the dialog restores the last tab/search the user left it on
let lastSelectedInterest = '';
let lastSearchText = '';

export function SuggestedFollowsDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				className={css.popup}
				label={m['components.dialogs.suggestedFollows.title']()}
				scroll="body"
			>
				<DialogInner handle={handle} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle }: { handle: Dialog.DialogHandle }) {
	const rawInterestsDisplayNames = useInterestsDisplayNames();
	const { data: preferences } = usePreferencesQuery();
	const personalizedInterests = preferences?.interests?.tags;
	// kept memoized: read from InterestTabs' own useEffect dep arrays.
	const interests = useMemo(
		() => [
			FOR_YOU_TAB,
			...Object.keys(rawInterestsDisplayNames)
				.sort(boostInterests(popularInterests))
				.sort(boostInterests(personalizedInterests)),
		],
		[rawInterestsDisplayNames, personalizedInterests],
	);
	const interestsDisplayNames = {
		[FOR_YOU_TAB]: m['common.feeds.forYou'](),
		...rawInterestsDisplayNames,
	};

	const [selectedInterest, setSelectedInterest] = useState(() => lastSelectedInterest || FOR_YOU_TAB);
	const [searchText, setSearchText] = useState(lastSearchText);
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();

	useEffect(() => {
		lastSearchText = searchText;
		lastSelectedInterest = selectedInterest;
	}, [searchText, selectedInterest]);

	const isForYou = selectedInterest === FOR_YOU_TAB;
	const hasSearchText = !!searchText;

	const {
		data: suggestions,
		error: suggestionsError,
		isFetching: isFetchingSuggestions,
	} = useGetSuggestedUsersForSeeMoreQuery({
		category: isForYou ? undefined : selectedInterest,
		limit: 50,
	});
	const {
		data: searchResults,
		error: searchResultsError,
		isFetching: isFetchingSearchResults,
	} = useActorSearch({ enabled: hasSearchText, query: searchText });

	const isFetching = hasSearchText ? isFetchingSearchResults : isFetchingSuggestions;
	const error = hasSearchText ? searchResultsError : suggestionsError;

	const results = hasSearchText ? searchResults?.pages.flatMap((p) => p.actors) : suggestions?.actors;
	const profiles: AnyProfileView[] = [];
	if (results) {
		const seen = new Set<string>();
		for (const profile of results) {
			if (seen.has(profile.did)) {
				continue;
			}
			if (profile.did === currentAccount?.did) {
				continue;
			}
			if (profile.viewer?.following) {
				continue;
			}
			seen.add(profile.did);
			profiles.push(profile);
		}
	}

	// drives the empty slot: placeholders while loading, then a network/search-empty message
	let listEmpty: ReactNode;
	if (isFetching) {
		listEmpty = <ProfileCard.LoadingPlaceholder count={10} />;
	} else if (error) {
		listEmpty = <Empty message={m['components.dialogs.error.network']()} />;
	} else if (hasSearchText) {
		listEmpty = <Empty message={m['common.search.empty']()} />;
	} else {
		listEmpty = <Empty message={m['components.dialogs.error.network']()} />;
	}

	const onSelectTab = (interest: string) => {
		setSelectedInterest(interest);
		setSearchText('');
	};

	const renderItem = (profile: AnyProfileView, index: number) =>
		moderationOpts ? (
			<ProfileCard.Default
				descriptionLines={2}
				followButtonProps={{ colorInverted: true, shape: 'round' }}
				moderationOpts={moderationOpts}
				onPress={() => handle.close()}
				profile={profile}
				showLabels={false}
				topBorder={index !== 0}
			/>
		) : null;

	return (
		<>
			<div className={css.header}>
				<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
					{m['components.dialogs.suggestedFollows.title']()}
				</Text>
				<Button
					className={css.closeButton}
					color="secondary"
					label={m['common.action.close']()}
					onClick={() => handle.close()}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<div className={css.search}>
				<SearchInput
					autoFocus
					label={m['common.search.action.profiles']()}
					maxLength={50}
					onChangeText={setSearchText}
					onClear={() => setSearchText('')}
					placeholder={m['components.dialogs.suggestedFollows.searchPlaceholder']()}
					value={searchText}
				/>
			</div>

			<Dialog.List
				className={css.list}
				data={profiles}
				key={hasSearchText ? searchText : selectedInterest}
				keyExtractor={(profile) => profile.did}
				ListEmptyComponent={listEmpty}
				ListHeaderComponent={
					hasSearchText ? null : (
						<div className={css.tabs}>
							<InterestTabs
								interests={interests}
								interestsDisplayNames={interestsDisplayNames}
								onSelectTab={onSelectTab}
								selectedInterest={selectedInterest}
							/>
						</div>
					)
				}
				renderItem={renderItem}
			/>
		</>
	);
}

function Empty({ message }: { message: string }) {
	return (
		<div className={css.empty}>
			<Text className={css.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
	);
}
