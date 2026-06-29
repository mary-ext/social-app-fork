import { type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

import { cleanError } from '#/lib/strings/errors';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import * as styles from '#/features/gifPicker/components/GifPickerGrid.css';
import { GifPickerItem } from '#/features/gifPicker/components/GifPickerItem';
import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';

export type GifPickerGridHandle = {
	scrollToTop: () => void;
};

type Props = {
	items: Gif[];
	numColumns: number;
	isFetchingNextPage: boolean;
	error: unknown;
	fetchNextPage: () => Promise<unknown>;
	onEndReached: () => void;
	onSelectGif: (gif: Gif) => void;
	ref?: Ref<GifPickerGridHandle>;
};

export function GifPickerGrid({
	items,
	numColumns,
	isFetchingNextPage,
	error,
	fetchNextPage,
	onEndReached,
	onSelectGif,
	ref,
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

	useImperativeHandle(ref, () => ({ scrollToTop: () => scrollRef.current?.scrollTo({ top: 0 }) }), []);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		const root = scrollRef.current;
		if (!sentinel || !root) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					onEndReachedRef.current();
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
				<div className={styles.columns}>
					{columns.map((column, i) => (
						<div key={i} className={styles.column}>
							{column.map((gif) => (
								<GifPickerItem key={gif.id} gif={gif} onSelectGif={onSelectGif} />
							))}
						</div>
					))}
				</div>
				{isFetchingNextPage ? (
					<CenteredSpinner label={m['features.gifPicker.load.loading']()} size="2xl" />
				) : error ? (
					<div className={styles.footer}>
						<Text size="sm" color="textContrastMedium" align="center">
							{cleanError(error)}
						</Text>
						<Button
							label={m['common.action.retry']()}
							size="small"
							color="secondary"
							onClick={() => void fetchNextPage()}
						>
							<ButtonText>{m['common.action.retry']()}</ButtonText>
						</Button>
					</div>
				) : null}
				<div ref={sentinelRef} aria-hidden />
			</div>
		</div>
	);
}

/**
 * Walks `items` in order and pushes each one into the currently shortest column, tracking accumulated
 * height-per-unit-width from each GIF's intrinsic aspect ratio. Preserves ordering top-to-bottom within each
 * column, which keeps pagination behavior intuitive as new pages stream in.
 */
function distributeIntoColumns(items: Gif[], numColumns: number): Gif[][] {
	const columns: Gif[][] = Array.from({ length: numColumns }, () => []);
	const heights = new Array(numColumns).fill(0);

	for (const item of items) {
		const [w, h] = item.media_formats.tinygif.dims;
		const ratio = w > 0 && h > 0 ? h / w : 1;

		let shortest = 0;
		for (let i = 1; i < numColumns; i++) {
			if (heights[i] < heights[shortest]) shortest = i;
		}
		columns[shortest]!.push(item);
		heights[shortest] += ratio;
	}

	return columns;
}
