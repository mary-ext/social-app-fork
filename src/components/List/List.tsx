import {
	memo,
	type ReactNode,
	type Ref,
	startTransition,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

import * as css from '#/components/List/List.css';

/** A post is "seen" once this much of it has been visible for {@link ON_ITEM_SEEN_WAIT_DURATION}. */
const ON_ITEM_SEEN_INTERSECTION_OPTS = { rootMargin: '-200px 0px -200px 0px' };
const ON_ITEM_SEEN_WAIT_DURATION = 0.5e3;

export type ListRenderItemInfo<ItemT> = {
	index: number;
	item: ItemT;
};

export type ListRenderItem<ItemT> = (info: ListRenderItemInfo<ItemT>) => ReactNode;

export type ListMethods = {
	scrollToEnd: (options?: { animated?: boolean }) => void;
	scrollToOffset: (options: { animated?: boolean; offset: number }) => void;
	scrollToTop: () => void;
};

export type ListRef = React.RefObject<ListMethods | null>;

export type ListProps<ItemT> = {
	data: readonly ItemT[] | null | undefined;
	/**
	 * Opts a row out of off-screen render-skipping (see {@link estimateHeight}). Return `true` for rows whose
	 * late height realization must not shift surrounding content — e.g. a scroll-anchor target and the row just
	 * above it. Only consulted when `estimateHeight` is set.
	 */
	disableSkipOffscreen?: (item: ItemT, index: number) => boolean;
	keyExtractor: (item: ItemT, index: number) => string;
	/** Shown in place of the rows when `data` is empty. */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the rows. */
	ListFooterComponent?: ReactNode;
	/** Rendered before the rows. */
	ListHeaderComponent?: ReactNode;
	/**
	 * Enables off-screen render-skipping (`content-visibility: auto`) on each row, seeding the placeholder
	 * height with this estimate (in px). Once a row has rendered, the browser remembers its real size and
	 * reuses it, so the estimate only governs rows that have never been on screen.
	 */
	estimateHeight?: number;
	/** Fires when the rendered content's size changes (via `ResizeObserver`). */
	onContentSizeChange?: (width: number, height: number) => void;
	onEndReached?: () => void;
	/** Lookahead before the end, in multiples of the viewport height. */
	onEndReachedThreshold?: number;
	/** Fires per row once it has been sufficiently visible long enough to count as seen. */
	onItemSeen?: (item: ItemT) => void;
	/** Fires when the list scrolls past (or back above) the top of its content. */
	onScrolledDownChange?: (isScrolledDown: boolean) => void;
	onStartReached?: () => void;
	/** Lookahead before the start, in multiples of the viewport height. */
	onStartReachedThreshold?: number;
	ref?: Ref<ListMethods>;
	renderItem: ListRenderItem<ItemT>;
};

/**
 * A non-virtualizing list bound to the document (full-window) scroll. Renders every row into the DOM and uses
 * `IntersectionObserver` sentinels for edge detection. Contained-scroll lists are a separate concern and not
 * served here.
 */
export function List<ItemT>({
	data,
	disableSkipOffscreen,
	keyExtractor,
	ListEmptyComponent,
	ListFooterComponent,
	ListHeaderComponent,
	estimateHeight,
	onContentSizeChange,
	onEndReached,
	onEndReachedThreshold,
	onItemSeen,
	onScrolledDownChange,
	onStartReached,
	onStartReachedThreshold,
	ref,
	renderItem,
}: ListProps<ItemT>) {
	const containerRef = useRef<HTMLDivElement>(null);

	useResizeObserver(containerRef, onContentSizeChange);

	useImperativeHandle(
		ref,
		() => ({
			scrollToTop() {
				window.scrollTo({ top: 0 });
			},
			scrollToOffset({ animated, offset }) {
				window.scrollTo({ behavior: animated ? 'smooth' : 'instant', left: 0, top: offset });
			},
			scrollToEnd({ animated = true } = {}) {
				window.scrollTo({
					behavior: animated ? 'smooth' : 'instant',
					left: 0,
					top: document.documentElement.scrollHeight,
				});
			},
		}),
		[],
	);

	const onStartVisibleChange = useNonReactiveCallback((isVisible: boolean) => {
		if (isVisible) onStartReached?.();
	});
	const onEndVisibleChange = useNonReactiveCallback((isVisible: boolean) => {
		if (isVisible) onEndReached?.();
	});
	const onAboveTheFoldChange = useNonReactiveCallback((isAboveTheFold: boolean) => {
		// `startTransition` keeps the dependent UI (e.g. a "load new posts" button) off the scroll path.
		startTransition(() => onScrolledDownChange?.(!isAboveTheFold));
	});

	const seen = useItemSeenObserver(onItemSeen);

	const isEmpty = !data || data.length === 0;
	const skipOffscreen = estimateHeight != null;

	return (
		<div
			ref={containerRef}
			className={css.container}
			style={skipOffscreen ? assignInlineVars({ [css.estimateHeightVar]: `${estimateHeight}px` }) : undefined}
		>
			{onScrolledDownChange && (
				<Visibility className={css.aboveTheFold} onVisibleChange={onAboveTheFoldChange} />
			)}
			{onStartReached && !isEmpty && (
				<EdgeVisibility
					containerRef={containerRef}
					onVisibleChange={onStartVisibleChange}
					topMargin={thresholdMargin(onStartReachedThreshold)}
				/>
			)}
			{ListHeaderComponent}
			{isEmpty
				? ListEmptyComponent
				: data.map((item, index) => {
						const key = keyExtractor(item, index);
						const skip = skipOffscreen && !disableSkipOffscreen?.(item, index);
						return (
							<Row key={key} index={index} item={item} renderItem={renderItem} seen={seen} skip={skip} />
						);
					})}
			{onEndReached && !isEmpty && (
				<EdgeVisibility
					bottomMargin={thresholdMargin(onEndReachedThreshold)}
					containerRef={containerRef}
					onVisibleChange={onEndVisibleChange}
				/>
			)}
			{ListFooterComponent}
		</div>
	);
}

/** Tracks per-row "seen" dwell against a single shared {@link IntersectionObserver}. */
type SeenObserver<ItemT> = {
	observe: (row: Element, item: ItemT) => void;
	unobserve: (row: Element) => void;
};

/**
 * Builds one {@link IntersectionObserver} for the whole list and routes each entry back to its row, so the
 * observer count stays at one regardless of how many rows render. Returns `null` while disabled.
 */
function useItemSeenObserver<ItemT>(
	onItemSeen: ((item: ItemT) => void) | undefined,
): SeenObserver<ItemT> | null {
	// Read the latest callback without rebuilding the observer when its identity changes.
	const reportSeen = useNonReactiveCallback(onItemSeen ?? (() => {}));
	const enabled = !!onItemSeen;

	const observer = useMemo(() => {
		if (!enabled) return null;
		const rows = new Map<Element, { item: ItemT; timeout?: ReturnType<typeof setTimeout> }>();
		const io = new IntersectionObserver((entries) => {
			batchedUpdates(() => {
				for (const entry of entries) {
					const row = rows.get(entry.target);
					if (!row) continue;
					if (entry.isIntersecting) {
						row.timeout ??= setTimeout(() => {
							row.timeout = undefined;
							reportSeen(row.item);
						}, ON_ITEM_SEEN_WAIT_DURATION);
					} else if (row.timeout != null) {
						clearTimeout(row.timeout);
						row.timeout = undefined;
					}
				}
			});
		}, ON_ITEM_SEEN_INTERSECTION_OPTS);
		return {
			rows,
			io,
			observe(row: Element, item: ItemT) {
				rows.set(row, { item });
				io.observe(row);
			},
			unobserve(row: Element) {
				const rec = rows.get(row);
				if (rec?.timeout != null) clearTimeout(rec.timeout);
				rows.delete(row);
				io.unobserve(row);
			},
		};
		// `reportSeen` is stable; rebuild only when toggling the feature on/off.
	}, [enabled, reportSeen]);

	useEffect(() => {
		return () => {
			observer?.io.disconnect();
			observer?.rows.forEach((rec) => {
				if (rec.timeout != null) clearTimeout(rec.timeout);
			});
		};
	}, [observer]);

	return observer;
}

/** The universal row wrapper: registers with the shared seen-observer when enabled. */
const Row = memo(function Row<ItemT>({
	index,
	item,
	renderItem,
	seen,
	skip,
}: {
	index: number;
	item: ItemT;
	renderItem: ListRenderItem<ItemT>;
	seen: SeenObserver<ItemT> | null;
	skip: boolean;
}) {
	const rowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!seen) return;
		const row = rowRef.current;
		if (!row) return;
		seen.observe(row, item);
		return () => seen.unobserve(row);
	}, [seen, item]);

	return (
		<div ref={rowRef} className={clsx(css.row, skip && css.rowSkip)}>
			{renderItem({ index, item })}
		</div>
	);
}) as <ItemT>(props: {
	index: number;
	item: ItemT;
	renderItem: ListRenderItem<ItemT>;
	seen: SeenObserver<ItemT> | null;
	skip: boolean;
}) => ReactNode;

const thresholdMargin = (threshold: number | undefined) => `${(threshold ?? 0) * 100}%`;

/**
 * Wraps {@link Visibility} so its observer is rebuilt whenever the content height changes — the
 * `%`-of-viewport margins are resolved against the sentinel's position, which shifts as rows are added or
 * removed.
 */
function EdgeVisibility({
	bottomMargin,
	containerRef,
	onVisibleChange,
	topMargin,
}: {
	bottomMargin?: string;
	containerRef: React.RefObject<Element | null>;
	onVisibleChange: (isVisible: boolean) => void;
	topMargin?: string;
}) {
	const [containerHeight, setContainerHeight] = useState(0);
	useResizeObserver(containerRef, (_width, height) => setContainerHeight(height));
	return (
		<Visibility
			key={containerHeight}
			bottomMargin={bottomMargin}
			onVisibleChange={onVisibleChange}
			topMargin={topMargin}
		/>
	);
}

/** A sentinel that reports when it enters/leaves the expanded viewport. Zero-size unless styled. */
function Visibility({
	bottomMargin = '0px',
	className = css.sentinel,
	onVisibleChange,
	style,
	topMargin = '0px',
}: {
	bottomMargin?: string;
	className?: string;
	onVisibleChange: (isVisible: boolean) => void;
	style?: React.CSSProperties;
	topMargin?: string;
}) {
	const tailRef = useRef<HTMLDivElement>(null);
	const isIntersecting = useRef(false);

	const handleIntersection = useEffectEvent((entries: IntersectionObserverEntry[]) => {
		batchedUpdates(() => {
			entries.forEach((entry) => {
				if (entry.isIntersecting !== isIntersecting.current) {
					isIntersecting.current = entry.isIntersecting;
					onVisibleChange(entry.isIntersecting);
				}
			});
		});
	});

	useEffect(() => {
		const observer = new IntersectionObserver(handleIntersection, {
			rootMargin: `${topMargin} 0px ${bottomMargin} 0px`,
		});
		const tail = tailRef.current;
		if (tail) observer.observe(tail);
		return () => {
			if (tail) observer.unobserve(tail);
		};
	}, [bottomMargin, topMargin]);

	return <div ref={tailRef} className={className} style={style} />;
}

function useResizeObserver(
	ref: React.RefObject<Element | null>,
	onResize: undefined | ((width: number, height: number) => void),
) {
	const handleResize = useEffectEvent(onResize ?? (() => {}));
	const isActive = !!onResize;
	useEffect(() => {
		if (!isActive) return;
		const node = ref.current;
		if (!node) return;
		const observer = new ResizeObserver((entries) => {
			batchedUpdates(() => {
				for (const entry of entries) {
					const rect = entry.contentRect;
					handleResize(rect.width, rect.height);
				}
			});
		});
		observer.observe(node);
		return () => observer.unobserve(node);
	}, [isActive, ref]);
}
