import {
	createContext,
	memo,
	type ReactNode,
	type Ref,
	startTransition,
	use,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { useConstant } from '#/lib/hooks/use-constant';
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
	 * opts a row out of off-screen render-skipping (see {@link estimateHeight}).
	 *
	 * @param row the row to check.
	 * @returns true if the row's late height realization must not shift surrounding content (e.g. scroll-anchor
	 *   targets).
	 */
	disableSkipOffscreen?: (item: ItemT, index: number) => boolean;
	keyExtractor: (item: ItemT, index: number) => string;
	/** Shown in place of the rows when `data` is empty. */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the rows. */
	ListFooterComponent?: ReactNode;
	/** Rendered before the rows. */
	ListHeaderComponent?: ReactNode;
	/** estimated row height in pixels to enable off-screen render-skipping using `content-visibility: auto` */
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
	/**
	 * The scrolling element the list reads for edge detection and drives for imperative scrolls. Omit to bind
	 * to the viewport (document scroll); pass a bounded `overflow` container's ref (e.g. a split-view column)
	 * to scroll within it instead.
	 */
	scrollRoot?: React.RefObject<HTMLElement | null>;
};

/**
 * a non-virtualizing list bound to the document scroll that renders all rows and uses IntersectionObserver
 * for edge detection.
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
	scrollRoot,
}: ListProps<ItemT>) {
	const containerRef = useRef<HTMLDivElement>(null);

	useResizeObserver(containerRef, onContentSizeChange);

	useImperativeHandle(
		ref,
		() => ({
			scrollToTop() {
				const root = scrollRoot ? scrollRoot.current! : window;
				root.scrollTo({ top: 0 });
			},
			scrollToOffset({ animated, offset }) {
				const root = scrollRoot ? scrollRoot.current! : window;
				root.scrollTo({ behavior: animated ? 'smooth' : 'instant', left: 0, top: offset });
			},
			scrollToEnd({ animated = true } = {}) {
				const root = scrollRoot ? scrollRoot.current! : document.documentElement;
				root.scrollTo({
					behavior: animated ? 'smooth' : 'instant',
					left: 0,
					top: root.scrollHeight,
				});
			},
		}),
		[scrollRoot],
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

	const isEmpty = !data || data.length === 0;
	const skipOffscreen = estimateHeight != null;

	let children = ListEmptyComponent;

	if (!isEmpty) {
		children = data.map((item, index) => {
			const key = keyExtractor(item, index);
			const skip = skipOffscreen && !disableSkipOffscreen?.(item, index);
			return <Row key={key} index={index} item={item} renderItem={renderItem} skip={skip} />;
		});

		if (onItemSeen !== undefined) {
			children = (
				<ItemSeenObserver onItemSeen={onItemSeen} root={scrollRoot}>
					{children}
				</ItemSeenObserver>
			);
		}
	}

	return (
		<div
			ref={containerRef}
			className={css.container}
			style={skipOffscreen ? assignInlineVars({ [css.estimateHeightVar]: `${estimateHeight}px` }) : undefined}
		>
			{onScrolledDownChange && (
				<Visibility className={css.aboveTheFold} onVisibleChange={onAboveTheFoldChange} root={scrollRoot} />
			)}

			{onStartReached && !isEmpty && (
				<EdgeVisibility
					containerRef={containerRef}
					onVisibleChange={onStartVisibleChange}
					root={scrollRoot}
					topMargin={thresholdMargin(onStartReachedThreshold)}
				/>
			)}

			{ListHeaderComponent}

			{children}

			{onEndReached && !isEmpty && (
				<EdgeVisibility
					bottomMargin={thresholdMargin(onEndReachedThreshold)}
					containerRef={containerRef}
					onVisibleChange={onEndVisibleChange}
					root={scrollRoot}
				/>
			)}

			{ListFooterComponent}
		</div>
	);
}

/** The shared seen-observer handed to rows through context: register a row's element against its item. */
type SeenObserver = {
	disconnect(): void;
	register(node: Element, item: unknown): void;
	unregister(node: Element): void;
};

const ItemSeenContext = createContext<SeenObserver | null>(null);

/**
 * owns the single {@link IntersectionObserver} shared by every seen-tracked row and reports each row's item to
 * {@link onItemSeen} once it dwells. mounted only while `onItemSeen` is set, so the observer exists exactly
 * when a row registers with it.
 */
function ItemSeenObserver<ItemT>({
	children,
	onItemSeen,
	root,
}: {
	children: ReactNode;
	onItemSeen: (item: ItemT) => void;
	root: React.RefObject<HTMLElement | null> | undefined;
}) {
	// Read the latest callback without rebuilding the observer when its identity changes.
	const reportSeen = useNonReactiveCallback(onItemSeen);

	const seen = useConstant(() => {
		const rows = new Map<Element, { item: ItemT; timeout?: ReturnType<typeof setTimeout> }>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const row = rows.get(entry.target);
					if (!row) {
						continue;
					}

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
			},
			{ ...ON_ITEM_SEEN_INTERSECTION_OPTS, root: root?.current ?? null },
		);

		return {
			disconnect() {
				observer.disconnect();
				rows.forEach((row) => {
					if (row.timeout != null) clearTimeout(row.timeout);
				});
			},
			register(node: Element, item: ItemT) {
				rows.set(node, { item });
				observer.observe(node);
			},
			unregister(node: Element) {
				const row = rows.get(node);
				if (row?.timeout != null) clearTimeout(row.timeout);
				rows.delete(node);
				observer.unobserve(node);
			},
		};
	});

	useEffect(() => seen.disconnect, [seen]);

	return <ItemSeenContext value={seen}>{children}</ItemSeenContext>;
}

/** The universal row wrapper: registers its element with the shared {@link ItemSeenObserver} when present. */
const Row = memo(function Row<ItemT>({
	index,
	item,
	renderItem,
	skip,
}: {
	index: number;
	item: ItemT;
	renderItem: ListRenderItem<ItemT>;
	skip: boolean;
}) {
	const seen = use(ItemSeenContext);

	return (
		<div
			ref={(node) => {
				if (seen === null || node === null) {
					return;
				}

				seen.register(node, item);
				return () => seen.unregister(node);
			}}
			className={clsx(css.row, skip && css.rowSkip)}
		>
			{renderItem({ index, item })}
		</div>
	);
}) as <ItemT>(props: {
	index: number;
	item: ItemT;
	renderItem: ListRenderItem<ItemT>;
	skip: boolean;
}) => ReactNode;

const thresholdMargin = (threshold: number | undefined) => `${(threshold ?? 0) * 100}%`;

/** wraps {@link Visibility} to rebuild its observer whenever the content height changes. */
function EdgeVisibility({
	bottomMargin,
	containerRef,
	onVisibleChange,
	root,
	topMargin,
}: {
	bottomMargin?: string;
	containerRef: React.RefObject<Element | null>;
	onVisibleChange: (isVisible: boolean) => void;
	root?: React.RefObject<Element | null>;
	topMargin?: string;
}) {
	const [containerHeight, setContainerHeight] = useState(0);
	useResizeObserver(containerRef, (_width, height) => setContainerHeight(height));
	return (
		<Visibility
			key={containerHeight}
			bottomMargin={bottomMargin}
			onVisibleChange={onVisibleChange}
			root={root}
			topMargin={topMargin}
		/>
	);
}

/** A sentinel that reports when it enters/leaves the expanded viewport. Zero-size unless styled. */
function Visibility({
	bottomMargin = '0px',
	className = css.sentinel,
	onVisibleChange,
	root,
	style,
	topMargin = '0px',
}: {
	bottomMargin?: string;
	className?: string;
	onVisibleChange: (isVisible: boolean) => void;
	root?: React.RefObject<Element | null>;
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
			root: root?.current ?? null,
			rootMargin: `${topMargin} 0px ${bottomMargin} 0px`,
		});
		const tail = tailRef.current;
		if (tail) observer.observe(tail);
		return () => {
			if (tail) observer.unobserve(tail);
		};
	}, [bottomMargin, root, topMargin]);

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
