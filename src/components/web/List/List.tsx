import { Fragment, type ReactNode, type Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

import * as css from '#/components/web/List/List.css';

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

export type ListProps<ItemT> = {
	data: readonly ItemT[] | null | undefined;
	keyExtractor: (item: ItemT, index: number) => string;
	/** Shown in place of the rows when `data` is empty. */
	ListEmptyComponent?: ReactNode;
	/** Rendered after the rows. */
	ListFooterComponent?: ReactNode;
	/** Rendered before the rows. */
	ListHeaderComponent?: ReactNode;
	/** Fires when the rendered content's size changes (via `ResizeObserver`). */
	onContentSizeChange?: (width: number, height: number) => void;
	onEndReached?: () => void;
	/** Lookahead before the end, in multiples of the viewport height. */
	onEndReachedThreshold?: number;
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
	keyExtractor,
	ListEmptyComponent,
	ListFooterComponent,
	ListHeaderComponent,
	onContentSizeChange,
	onEndReached,
	onEndReachedThreshold,
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

	const isEmpty = !data || data.length === 0;

	return (
		// the container grows with its content and carries no min-height: short content stays at the host's
		// height (the screen already fills the viewport) so the document doesn't scroll into empty space.
		<div ref={containerRef}>
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
				: data.map((item, index) => (
						<Fragment key={keyExtractor(item, index)}>{renderItem({ index, item })}</Fragment>
					))}
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

/** A zero-size sentinel that reports when it enters/leaves the expanded viewport. */
function Visibility({
	bottomMargin = '0px',
	onVisibleChange,
	topMargin = '0px',
}: {
	bottomMargin?: string;
	onVisibleChange: (isVisible: boolean) => void;
	topMargin?: string;
}) {
	const tailRef = useRef<HTMLDivElement>(null);
	const isIntersecting = useRef(false);

	const handleIntersection = useNonReactiveCallback((entries: IntersectionObserverEntry[]) => {
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
	}, [bottomMargin, handleIntersection, topMargin]);

	return <div ref={tailRef} className={css.sentinel} />;
}

function useResizeObserver(
	ref: React.RefObject<Element | null>,
	onResize: undefined | ((width: number, height: number) => void),
) {
	const handleResize = useNonReactiveCallback(onResize ?? (() => {}));
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
	}, [handleResize, isActive, ref]);
}
