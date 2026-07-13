import { Fragment, type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

import { clsx } from 'clsx';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as styles from '#/components/Dialog/Popup.css';

export type ListProps<ItemT> = {
	data: readonly ItemT[];
	keyExtractor: (item: ItemT, index: number) => string;
	renderItem: (item: ItemT, index: number) => ReactNode;
	/** Extra classes on the scroll region (e.g. a min-height floor, content padding, or a tinted surface). */
	className?: string;
	/** fired when the end of the list scrolls into view to load the next page */
	onEndReached?: () => void;
	/** Distance (px) from the bottom edge at which `onEndReached` fires — i.e. the observer's `rootMargin`. */
	onEndReachedMargin?: number;
	/** Shown (as a centered spinner) below the items while the next page loads. Needs `loadingLabel`. */
	isFetchingNextPage?: boolean;
	/** Accessible label for the next-page spinner; pass it alongside `onEndReached`/`isFetchingNextPage`. */
	loadingLabel?: string;
	/** Rendered in place of the items when `data` is empty (e.g. an empty/loading/error state). */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the items, scrolling with them (e.g. an end-of-list note). Hidden while empty. */
	ListFooterComponent?: ReactNode;
	/**
	 * rendered above the items inside the scroll region, scrolling with them (e.g. a non-sticky filter row).
	 * shown even while empty (above {@link ListEmptyComponent}), unlike the footer. for pinned chrome use a
	 * sibling `Header` slot instead.
	 */
	ListHeaderComponent?: ReactNode;
};

/**
 * scrollable body of a `body`-scroll {@link Popup} for paginated lists. maps `data` through `renderItem` and
 * loads more via an `IntersectionObserver` sentinel. compose pinned chrome as sibling `Header`/`Footer`
 * slots, not inside the list.
 */
export function List<ItemT>({
	data,
	keyExtractor,
	renderItem,
	className,
	onEndReached,
	onEndReachedMargin = 600,
	isFetchingNextPage,
	loadingLabel,
	ListEmptyComponent,
	ListFooterComponent,
	ListHeaderComponent,
}: ListProps<ItemT>) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// keep the observer stable while always calling the latest handler — it closes over fresh pagination state.
	// useLayoutEffect (not useEffect) so the ref is current before the browser can fire the observer callback
	// after a commit — a passive effect would leave a window where the old observer calls the prior handler.
	const onEndReachedRef = useRef(onEndReached);
	useLayoutEffect(() => {
		onEndReachedRef.current = onEndReached;
	});

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
		<div ref={scrollRef} className={clsx(styles.body, className)}>
			{ListHeaderComponent}
			{isEmpty ? (
				ListEmptyComponent
			) : (
				<>
					{data.map((item, index) => (
						<Fragment key={keyExtractor(item, index)}>{renderItem(item, index)}</Fragment>
					))}
					{ListFooterComponent}
					{isFetchingNextPage && loadingLabel && <CenteredSpinner label={loadingLabel} size="xl" />}
					<div ref={sentinelRef} aria-hidden />
				</>
			)}
		</div>
	);
}
