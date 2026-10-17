import { memo, type ReactNode, use } from 'react';

import * as css from '#/components/List/List.css';

import { ItemSeenContext } from './ItemSeenObserver';
import type { ListRenderItem } from './List';

export type RowProps<ItemT> = {
	index: number;
	item: ItemT;
	renderItem: ListRenderItem<ItemT>;
};

/** a list row that renders its content unconditionally. */
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `memo` erases the type parameter
export const Row = memo(function Row<ItemT>({ index, item, renderItem }: RowProps<ItemT>) {
	const seen = use(ItemSeenContext);

	return (
		<div
			ref={(node) => {
				if (seen === null || node === null) {
					return;
				}

				return seen.register(node, item);
			}}
			className={css.row}
		>
			{renderItem({ index, item })}
		</div>
	);
}) as <ItemT>(props: RowProps<ItemT>) => ReactNode;
