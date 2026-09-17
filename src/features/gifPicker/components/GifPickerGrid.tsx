import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

import type { Gif } from '#/lib/media/external-gif/types';

import * as styles from '#/features/gifPicker/components/GifPickerGrid.css';
import { GifPickerItem } from '#/features/gifPicker/components/GifPickerItem';

type Props = {
	/** shown in place of the columns while `items` is empty. */
	empty: ReactNode;
	/** content below the columns. */
	footer?: ReactNode;
	/** scrollable content above the columns. */
	header?: ReactNode;
	items: Gif[];
	numColumns: number;
	/** called as the end of the content nears the viewport. */
	onEndReached?: () => void;
	onSelectGif: (gif: Gif) => void;
};

export function GifPickerGrid({
	empty,
	footer,
	header,
	items,
	numColumns,
	onEndReached,
	onSelectGif,
}: Props) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// keep the observer stable while always calling the latest handler — onEndReached closes over fresh
	// pagination state on every render. useLayoutEffect (not useEffect) so the ref is current before the
	// browser can fire the observer callback after a commit.
	const onEndReachedRef = useRef(onEndReached);
	useLayoutEffect(() => {
		onEndReachedRef.current = onEndReached;
	});

	useEffect(() => {
		const sentinel = sentinelRef.current;
		const root = scrollRef.current;
		if (!sentinel || !root) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					onEndReachedRef.current?.();
				}
			},
			// prefetch roughly a screen ahead, mirroring the FlatList's onEndReachedThreshold of 1.
			{ root, rootMargin: '600px 0px' },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	const columns = distributeIntoColumns(items, numColumns);

	return (
		<div ref={scrollRef} className={styles.scroll}>
			<div className={styles.content}>
				{header}
				{items.length > 0 ? (
					<div className={styles.columns}>
						{columns.map((column, i) => (
							// oxlint-disable-next-line react/no-array-index-key -- fixed column count; gifs keyed by id
							<div key={i} className={styles.column}>
								{column.map((gif) => (
									<GifPickerItem key={gif.id} gif={gif} onSelectGif={onSelectGif} />
								))}
							</div>
						))}
					</div>
				) : (
					empty
				)}
				{footer}
				<div ref={sentinelRef} aria-hidden />
			</div>
		</div>
	);
}

/**
 * distributes items into the currently shortest column to balance column heights while preserving
 * top-to-bottom order.
 *
 * @param items items to distribute
 */
function distributeIntoColumns(items: Gif[], numColumns: number): Gif[][] {
	const columns: Gif[][] = Array.from({ length: numColumns }, () => []);
	const heights: number[] = Array.from({ length: numColumns }, () => 0);

	for (const item of items) {
		const [w, h] = item.media_formats.tinygif.dims;
		const ratio = w > 0 && h > 0 ? h / w : 1;

		let shortest = 0;
		let shortestHeight = heights[0]!;
		for (let i = 1; i < numColumns; i++) {
			const height = heights[i]!;
			if (height < shortestHeight) {
				shortest = i;
				shortestHeight = height;
			}
		}
		columns[shortest]!.push(item);
		heights[shortest] = shortestHeight + ratio;
	}

	return columns;
}
