import type { ReactNode } from 'react';

import { cleanError } from '#/lib/errors';

import { type MyListsFilter, useMyListsQuery } from '#/state/queries/my-lists';

import { List } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import * as ListCard from '#/components/ListCard';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const LIST_ITEM_HEIGHT_ESTIMATE = 120;

/** Renders the viewer's own lists, one {@link ListCard.Default} row per list. */
export function MyLists({ filter }: { filter: MyListsFilter }): ReactNode {
	const { data, error, isError, isPending, refetch } = useMyListsQuery(filter);

	const emptyText = (() => {
		switch (filter) {
			case 'curate': {
				return m['common.list.description']();
			}
			case 'mod': {
				return m['common.list.moderation.description']();
			}
			default: {
				return m['common.list.empty']();
			}
		}
	})();

	const lists = data ?? [];

	if (lists.length < 1) {
		if (isError) {
			return <ListError hideBackButton message={cleanError(error)} onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <ListCard.LoadingPlaceholder count={10} />;
		}

		return <ListEmpty icon={ListIcon} message={emptyText} />;
	}

	return (
		<List
			data={lists}
			estimateHeight={LIST_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			renderItem={({ index, item }) => <ListCard.Default topBorder={index !== 0} view={item} />}
			ListFooterComponent={<ListTail.Frame />}
		/>
	);
}
