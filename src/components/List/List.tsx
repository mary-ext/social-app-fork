import { type ReactNode, type Ref, startTransition, useEffect, useImperativeHandle, useRef } from 'react';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

import * as css from '#/components/List/List.css';

import { useIsFocused } from '#/routes';

import { ItemSeenObserver } from './ItemSeenObserver';
import { Row } from './Row';
import { Virtualizer, type VirtualizerMethods } from './Virtualizer';

export type ListRenderItemInfo<ItemT> = {
	index: number;
	item: ItemT;
};

export type ListRenderItem<ItemT> = (info: ListRenderItemInfo<ItemT>) => ReactNode;

export type ListMethods = {
	scrollToEnd: (options?: { animated?: boolean }) => void;
	/**
	 * scrolls the indexed row to the start of the list's visible viewport.
	 *
	 * @param options target index and optional pixels to leave before the row
	 * @returns whether a virtualized row was available to scroll to
	 */
	scrollToIndex: (options: { index: number; offset?: number }) => boolean;
	scrollToOffset: (options: { animated?: boolean; offset: number }) => void;
	scrollToTop: () => void;
};

export type ListRef = React.RefObject<ListMethods | null>;

export type ListProps<ItemT> = {
	data: readonly ItemT[] | null | undefined;
	keyExtractor: (item: ItemT, index: number) => string;
	/** Shown in place of the rows when `data` is empty. */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the rows. */
	ListFooterComponent?: ReactNode;
	/** Rendered before the rows. */
	ListHeaderComponent?: ReactNode;
	/**
	 * estimated row height in pixels. when set, off-screen rows are virtualized (their content unmounted),
	 * using this as the placeholder height until a row has been measured.
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
	/** number of extra rows rendered before and after the visible range. */
	overscanCount?: number;
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
 * renders `data` as a vertical list, calling the `on*` callbacks as rows approach the scroll edges. set
 * `estimateHeight` to virtualize off-screen rows.
 */
export function List<ItemT>({
	data,
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
	overscanCount = 3,
	ref,
	renderItem,
	scrollRoot,
}: ListProps<ItemT>) {
	const isFocused = useIsFocused();
	const virtualizerRef = useRef<VirtualizerMethods>(null);

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
			scrollToIndex(options) {
				return virtualizerRef.current?.scrollToIndex(options) ?? false;
			},
		}),
		[scrollRoot],
	);

	const onStartVisibleChange = useNonReactiveCallback((isVisible: boolean) => {
		if (isVisible) {
			onStartReached?.();
		}
	});
	const onEndVisibleChange = useNonReactiveCallback((isVisible: boolean) => {
		if (isVisible) {
			onEndReached?.();
		}
	});
	const onAboveTheFoldChange = useNonReactiveCallback((isAboveTheFold: boolean) => {
		// `startTransition` keeps the dependent UI (e.g. a "load new posts" button) off the scroll path.
		startTransition(() => onScrolledDownChange?.(!isAboveTheFold));
	});

	const rows = data ?? [];
	const isEmpty = rows.length === 0;
	const itemCount = rows.length;
	const virtualize = estimateHeight != null;
	const renderRows = !isEmpty || (virtualize && !isFocused);

	let children = ListEmptyComponent;

	if (renderRows) {
		if (virtualize) {
			children = (
				<Virtualizer
					data={rows}
					enabled={isFocused}
					estimateHeight={estimateHeight}
					keyExtractor={keyExtractor}
					overscanCount={overscanCount}
					ref={virtualizerRef}
					renderItem={renderItem}
					scrollRoot={scrollRoot}
				/>
			);
		} else {
			children = rows.map((item, index) => {
				const key = keyExtractor(item, index);

				return <Row key={key} index={index} item={item} renderItem={renderItem} />;
			});
		}

		if (onItemSeen !== undefined) {
			children = (
				<ItemSeenObserver enabled={isFocused} onItemSeen={onItemSeen} root={scrollRoot}>
					{children}
				</ItemSeenObserver>
			);
		}
	}

	return (
		<div
			ref={(node) => {
				if (!isFocused || onContentSizeChange === undefined || node === null) {
					return;
				}

				const observer = new ResizeObserver((entries) => {
					const entry = entries[0]!;
					const rect = entry.contentRect;

					onContentSizeChange(rect.width, rect.height);
				});

				observer.observe(node);
				return () => observer.disconnect();
			}}
			className={css.container({ virtualized: virtualize })}
		>
			{onScrolledDownChange && (
				<Visibility
					className={css.aboveTheFold}
					enabled={isFocused}
					onVisibleChange={onAboveTheFoldChange}
					root={scrollRoot}
				/>
			)}

			{onStartReached && !isEmpty && (
				<Visibility
					key={itemCount}
					enabled={isFocused}
					onVisibleChange={onStartVisibleChange}
					root={scrollRoot}
					topMargin={thresholdMargin(onStartReachedThreshold)}
				/>
			)}

			{ListHeaderComponent}

			{children}

			{onEndReached && !isEmpty && (
				<Visibility
					key={itemCount}
					bottomMargin={thresholdMargin(onEndReachedThreshold)}
					enabled={isFocused}
					onVisibleChange={onEndVisibleChange}
					root={scrollRoot}
				/>
			)}

			{ListFooterComponent}
		</div>
	);
}

const thresholdMargin = (threshold: number | undefined) => `${(threshold ?? 0) * 100}%`;

function Visibility({
	bottomMargin = '0px',
	className = css.sentinel,
	enabled,
	onVisibleChange,
	root,
	topMargin = '0px',
}: {
	bottomMargin?: string;
	className?: string;
	enabled: boolean;
	onVisibleChange: (isVisible: boolean) => void;
	root?: React.RefObject<Element | null>;
	topMargin?: string;
}) {
	const isIntersecting = useRef<boolean | undefined>(undefined);
	const nodeRef = useRef<HTMLDivElement | null>(null);

	// observe in a passive effect, not the callback ref: a custom `root` is an ancestor whose ref is still
	// null during the child-first commit, so the ref would fall back to the viewport and apply the margins
	// against the wrong bounds.
	useEffect(() => {
		const node = nodeRef.current;
		if (!enabled || node === null) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]!;
				const next = entry.isIntersecting;

				if (isIntersecting.current !== next) {
					isIntersecting.current = next;
					batchedUpdates(() => onVisibleChange(next));
				}
			},
			{
				root: root?.current ?? null,
				rootMargin: `${topMargin} 0px ${bottomMargin} 0px`,
			},
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [bottomMargin, enabled, onVisibleChange, root, topMargin]);

	return <div ref={nodeRef} className={className} />;
}
