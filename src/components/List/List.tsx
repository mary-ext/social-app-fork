import { type ReactNode, type Ref, startTransition, useImperativeHandle, useRef } from 'react';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { useWindowHeight } from '#/lib/hooks/use-window-height';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

import * as css from '#/components/List/List.css';

import { ItemSeenObserver } from './ItemSeenObserver';
import { Row } from './Row';
import { overscanRatio, VirtualRow, VirtualRowObserver } from './VirtualRow';

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
	 * opts a row out of virtualization (see {@link estimateHeight}), keeping it mounted at all times.
	 *
	 * @param item the row's item.
	 * @param index the row's index.
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

	const windowHeight = useWindowHeight();

	const isEmpty = !data || data.length === 0;
	const itemCount = data?.length ?? 0;
	const virtualize = estimateHeight != null;
	// eager-mount the rows the observer would keep alive around the viewport, so they don't flash blank first.
	const eagerCount = estimateHeight != null ? Math.ceil((windowHeight * overscanRatio) / estimateHeight) : 0;

	let children = ListEmptyComponent;

	if (!isEmpty) {
		if (virtualize) {
			children = (
				<VirtualRowObserver root={scrollRoot}>
					{data.map((item, index) => {
						const key = keyExtractor(item, index);
						const virtual = !disableSkipOffscreen?.(item, index);

						if (virtual) {
							return (
								<VirtualRow
									key={key}
									estimateHeight={estimateHeight}
									index={index}
									initialVisible={index < eagerCount}
									item={item}
									renderItem={renderItem}
								/>
							);
						} else {
							return <Row key={key} index={index} item={item} renderItem={renderItem} />;
						}
					})}
				</VirtualRowObserver>
			);
		} else {
			children = data.map((item, index) => {
				const key = keyExtractor(item, index);

				return <Row key={key} index={index} item={item} renderItem={renderItem} />;
			});
		}

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
			ref={(node) => {
				if (onContentSizeChange === undefined || node === null) {
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
			className={css.container}
		>
			{onScrolledDownChange && (
				<Visibility className={css.aboveTheFold} onVisibleChange={onAboveTheFoldChange} root={scrollRoot} />
			)}

			{onStartReached && !isEmpty && (
				<Visibility
					key={itemCount}
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
	const isIntersecting = useRef<boolean | undefined>(undefined);

	return (
		<div
			ref={(node) => {
				if (node === null) {
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
			}}
			className={className}
			style={style}
		/>
	);
}
