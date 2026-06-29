import { useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useActorSearch } from '#/state/queries/actor-search';

import { useWizardState } from '#/screens/StarterPack/Wizard/State';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { WizardProfileCard } from '#/components/StarterPack/Wizard/WizardListCard';
import { Text } from '#/components/Text';
import { SearchInput } from '#/components/web/forms/SearchInput';

import { m } from '#/paraglide/messages';

import * as css from './Wizard.css';

function keyExtractor(item: AnyProfileView) {
	return item?.did ?? '';
}

export function StepProfiles({ moderationOpts }: { moderationOpts: ModerationOptions }) {
	const [state, dispatch] = useWizardState();
	const [query, setQuery] = useState('');

	const {
		data: topPages,
		fetchNextPage,
		isLoading: isLoadingTopPages,
	} = useActorSearch({
		query: encodeURIComponent('*'),
	});
	const topFollowers = topPages?.pages.flatMap((p) => p.actors).filter((p) => !p.associated?.labeler);

	const { data: resultsUnfiltered, isFetching: isFetchingResults } = useActorAutocompleteQuery(
		query,
		true,
		12,
	);
	const results = resultsUnfiltered?.filter((p) => !p.associated?.labeler);

	const isLoading = isLoadingTopPages || isFetchingResults;

	const renderItem = ({ item }: ListRenderItemInfo<AnyProfileView>) => {
		return (
			<WizardProfileCard
				profile={item}
				btnType="checkbox"
				state={state}
				dispatch={dispatch}
				moderationOpts={moderationOpts}
			/>
		);
	};

	return (
		<>
			<div className={css.searchBar}>
				<SearchInput
					value={query}
					onChangeText={setQuery}
					onClear={() => setQuery('')}
					label={m['common.action.search']()}
					placeholder={m['common.action.search']()}
				/>
			</div>
			<List
				data={query ? results : topFollowers}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				onEndReached={!query ? () => void fetchNextPage() : undefined}
				onEndReachedThreshold={0.25}
				ListEmptyComponent={
					<div className={css.empty}>
						{isLoading ? (
							<CenteredSpinner label={m['common.status.loading']()} size="xl" />
						) : (
							<Text weight="semiBold" size="lg" align="center" className={css.emptyText}>
								{m['screens.starterPack.people.noResults']()}
							</Text>
						)}
					</div>
				}
			/>
		</>
	);
}
