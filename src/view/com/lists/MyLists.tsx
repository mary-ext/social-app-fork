import type { AppBskyGraphDefs as GraphDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/strings/errors';

import { type MyListsFilter, useMyListsQuery } from '#/state/queries/my-lists';

import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import * as ListCard from '#/components/ListCard';
import { ListFooter } from '#/components/Lists';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { EmptyState } from '../util/EmptyState';
import { ErrorMessage } from '../util/error/ErrorMessage';

const LOADING = { _reactKey: '__loading__' } as const;
const EMPTY = { _reactKey: '__empty__' } as const;
const ERROR_ITEM = { _reactKey: '__error__' } as const;

type MyListItem = GraphDefs.ListView | typeof EMPTY | typeof ERROR_ITEM | typeof LOADING;
type MyListSentinel = Exclude<MyListItem, GraphDefs.ListView>;

const isMyListSentinel = (item: MyListItem): item is MyListSentinel => {
	return '_reactKey' in item;
};

/** Renders the viewer's own lists, one {@link ListCard.Default} row per list. */
export function MyLists({ filter }: { filter: MyListsFilter }): React.ReactNode {
	const { data, isPending, isError, error, refetch } = useMyListsQuery(filter);
	const isEmpty = !isPending && !data?.length;

	let items: MyListItem[] = [];
	if (isError && isEmpty) {
		items = items.concat([ERROR_ITEM]);
	}
	if (isPending) {
		items = items.concat([LOADING]);
	} else if (isEmpty) {
		items = items.concat([EMPTY]);
	} else if (data) {
		items = items.concat(data);
	}

	// rendering
	// =

	const emptyText = (() => {
		switch (filter) {
			case 'curate':
				return m['view.list.description']();
			case 'mod':
				return m['view.list.moderation.description']();
			default:
				return m['common.list.empty']();
		}
	})();

	const renderItem = ({ index, item }: ListRenderItemInfo<MyListItem>) => {
		if (isMyListSentinel(item)) {
			if (item === ERROR_ITEM) {
				return <ErrorMessage message={cleanError(error)} onPressTryAgain={() => void refetch()} />;
			}
			if (item === LOADING) {
				return <ListCard.LoadingPlaceholder count={10} />;
			}
			return <EmptyState icon={ListIcon} iconColor={colors.textContrastMedium} message={emptyText} />;
		}
		return <ListCard.Default topBorder={index !== 0} view={item} />;
	};

	return (
		<List
			data={items}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListFooterComponent={isEmpty ? null : <ListFooter />}
		/>
	);
}

function keyExtractor(item: MyListItem) {
	return isMyListSentinel(item) ? item._reactKey : item.uri;
}
