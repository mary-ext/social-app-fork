import { type ReactNode, type Ref, useRef } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/components/Dialog/Popup.css';
import { List as BaseList, type ListMethods, type ListRenderItem } from '#/components/List/List';

export type { ListRenderItem, ListRenderItemInfo } from '#/components/List/List';

export type ListProps<ItemT> = {
	data: readonly ItemT[];
	keyExtractor: (item: ItemT, index: number) => string;
	/** shown in place of the rows when `data` is empty, below any header. */
	ListEmptyComponent?: ReactNode;
	/** shown after non-empty data; the place for a pagination spinner or retry. */
	ListFooterComponent?: ReactNode;
	/** shown before items, including when `data` is empty. */
	ListHeaderComponent?: ReactNode;
	className?: string;
	/** enables virtualization with this estimated row height. */
	estimateHeight?: number;
	onEndReached?: () => void;
	/** exposes imperative scrolling controls for the list. */
	ref?: Ref<ListMethods>;
	renderItem: ListRenderItem<ItemT>;
};

/**
 * renders a list in a body-scroll popup.
 *
 * @param props list content and pagination options
 * @returns the list scroll region
 */
export function List<ItemT>({
	data,
	keyExtractor,
	ListEmptyComponent,
	ListFooterComponent,
	ListHeaderComponent,
	className,
	estimateHeight,
	onEndReached,
	ref,
	renderItem,
}: ListProps<ItemT>) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const isEmpty = data.length === 0;

	return (
		<div ref={scrollRef} className={clsx(styles.body, className)}>
			<BaseList
				data={data}
				estimateHeight={estimateHeight}
				keyExtractor={keyExtractor}
				ListEmptyComponent={ListEmptyComponent}
				ListFooterComponent={!isEmpty && ListFooterComponent}
				ListHeaderComponent={ListHeaderComponent}
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				ref={ref}
				renderItem={renderItem}
				scrollRoot={scrollRef}
			/>
		</div>
	);
}
