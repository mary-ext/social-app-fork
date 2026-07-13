import { useState } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { DISCOVER_FEED_URI } from '#/lib/constants';

import { useGetPopularFeedsQuery, usePopularFeedsSearch, useSavedFeeds } from '#/state/queries/feed';

import { useWizardState } from '#/screens/StarterPack/Wizard/State';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { SearchInput } from '#/components/forms/SearchInput';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { WizardFeedCard } from '#/components/StarterPack/Wizard/WizardListCard';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './Wizard.css';

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
	return item.uri;
}

export function StepFeeds({ moderationOpts }: { moderationOpts: ModerationOptions }) {
	const [state, dispatch] = useWizardState();
	const [query, setQuery] = useState('');
	const throttledQuery = useThrottledValue(query, 500);

	const { data: savedFeedsAndLists, isFetchedAfterMount: isFetchedSavedFeeds } = useSavedFeeds();
	const savedFeeds = savedFeedsAndLists?.feeds
		.filter((f) => f.type === 'feed' && f.view.uri !== DISCOVER_FEED_URI)
		.map((f) => f.view) as AppBskyFeedDefs.GeneratorView[];

	const {
		data: popularFeedsPages,
		fetchNextPage,
		isLoading: isLoadingPopularFeeds,
	} = useGetPopularFeedsQuery({
		limit: 30,
	});
	const popularFeeds = popularFeedsPages?.pages.flatMap((p) => p.feeds) ?? [];

	// If we have saved feeds already loaded, display them immediately
	// Then, when popular feeds have loaded we can concat them to the saved feeds
	const suggestedFeeds: AppBskyFeedDefs.GeneratorView[] | undefined =
		savedFeeds || isFetchedSavedFeeds
			? popularFeeds
				? savedFeeds.concat(popularFeeds.filter((f) => !savedFeeds.some((sf) => sf.uri === f.uri)))
				: savedFeeds
			: undefined;

	const { data: searchedFeeds, isFetching: isFetchingSearchedFeeds } = usePopularFeedsSearch({
		query: throttledQuery,
	});

	const isLoading = !isFetchedSavedFeeds || isLoadingPopularFeeds || isFetchingSearchedFeeds;

	const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) => {
		return (
			<WizardFeedCard
				generator={item}
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
				data={query ? searchedFeeds : suggestedFeeds}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				onEndReached={!query ? () => void fetchNextPage() : undefined}
				onEndReachedThreshold={2}
				ListEmptyComponent={
					<div className={css.empty}>
						{isLoading ? (
							<CenteredSpinner label={m['common.status.loading']()} size="xl" />
						) : (
							<Text weight="semiBold" size="lg" align="center" className={css.emptyText}>
								{m['screens.starterPack.feeds.noResults']()}
							</Text>
						)}
					</div>
				}
			/>
		</>
	);
}
