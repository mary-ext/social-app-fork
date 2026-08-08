import { type ReactNode, useRef } from 'react';

import { clsx } from 'clsx';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as styles from '#/components/Dialog/Popup.css';
import { List as BaseList, type ListRenderItem } from '#/components/List/List';

export type { ListRenderItem, ListRenderItemInfo } from '#/components/List/List';

export type ListProps<ItemT> = {
	data: readonly ItemT[];
	keyExtractor: (item: ItemT, index: number) => string;
	ListEmptyComponent?: ReactNode;
	/** shown after non-empty data. */
	ListFooterComponent?: ReactNode;
	/** shown before items, including when `data` is empty. */
	ListHeaderComponent?: ReactNode;
	className?: string;
	/** enables virtualization with this estimated row height. */
	estimateHeight?: number;
	isFetchingNextPage?: boolean;
	/** required to show the pagination spinner. */
	loadingLabel?: string;
	onEndReached?: () => void;
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
	isFetchingNextPage,
	loadingLabel,
	onEndReached,
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
				ListFooterComponent={
					!isEmpty && (
						<>
							{ListFooterComponent}
							{isFetchingNextPage && loadingLabel && <CenteredSpinner label={loadingLabel} size="xl" />}
						</>
					)
				}
				ListHeaderComponent={ListHeaderComponent}
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				renderItem={renderItem}
				scrollRoot={scrollRef}
			/>
		</div>
	);
}
