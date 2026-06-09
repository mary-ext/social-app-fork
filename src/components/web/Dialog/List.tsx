import { Fragment, type ReactNode, useEffect, useRef } from 'react';

import { CenteredSpinner } from '#/components/web/CenteredSpinner';
import * as styles from '#/components/web/Dialog/Popup.css';

export type ListProps<ItemT> = {
	data: readonly ItemT[];
	keyExtractor: (item: ItemT, index: number) => string;
	renderItem: (item: ItemT, index: number) => ReactNode;
	/**
	 * Fired when the end of the list scrolls into view, to load the next page. Detected with an
	 * `IntersectionObserver` whose root is the scroll region (no effect unless `data` is non-empty).
	 */
	onEndReached?: () => void;
	/** Distance (px) from the bottom edge at which `onEndReached` fires — i.e. the observer's `rootMargin`. */
	onEndReachedMargin?: number;
	/** Shown (as a centered spinner) below the items while the next page loads. */
	isFetchingNextPage?: boolean;
	/** Accessible label for the next-page spinner. */
	loadingLabel: string;
	/** Rendered in place of the items when `data` is empty (e.g. an empty/loading/error state). */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the items, scrolling with them (e.g. an end-of-list note). Hidden while empty. */
	ListFooterComponent?: ReactNode;
};

/**
 * The scrollable body of a `body`-scroll {@link Popup}, specialised for a paginated list: maps `data` through
 * `renderItem` and loads more via an `IntersectionObserver` sentinel. Replaces the old `Dialog.InnerFlatList`
 * (web is unvirtualised — fine for paginated or short lists). Compose pinned chrome as sibling
 * `Header`/`Footer` slots, not inside the list.
 */
export function List<ItemT>({
	data,
	keyExtractor,
	renderItem,
	onEndReached,
	onEndReachedMargin = 600,
	isFetchingNextPage,
	loadingLabel,
	ListEmptyComponent,
	ListFooterComponent,
}: ListProps<ItemT>) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// keep the observer stable while always calling the latest handler — it closes over fresh pagination state.
	const onEndReachedRef = useRef(onEndReached);
	onEndReachedRef.current = onEndReached;

	const isEmpty = data.length === 0;
	// re-observe when the page count changes: a fresh observer reports its current intersection on connect, so
	// it keeps loading until the sentinel is pushed off-screen (without it, a still-visible sentinel never
	// re-fires after a page settles).
	useEffect(() => {
		if (!onEndReachedRef.current || isEmpty) {
			return;
		}
		const root = scrollRef.current;
		const sentinel = sentinelRef.current;
		if (!root || !sentinel) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					onEndReachedRef.current?.();
				}
			},
			{ root, rootMargin: `${onEndReachedMargin}px 0px` },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [isEmpty, onEndReachedMargin, data.length]);

	return (
		<div ref={scrollRef} className={styles.body}>
			{isEmpty ? (
				ListEmptyComponent
			) : (
				<>
					{data.map((item, index) => (
						<Fragment key={keyExtractor(item, index)}>{renderItem(item, index)}</Fragment>
					))}
					{ListFooterComponent}
					{isFetchingNextPage && <CenteredSpinner label={loadingLabel} size="lg" />}
					<div ref={sentinelRef} aria-hidden />
				</>
			)}
		</div>
	);
}
