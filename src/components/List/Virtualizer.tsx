import {
	memo,
	type ReactNode,
	type Ref,
	use,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useSyncExternalStore,
} from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';
import { definite, type FalsyValue } from '@mary/array-fns';

import { useConstant } from '#/lib/hooks/use-constant';

import * as css from '#/components/List/List.css';

import { ItemSeenContext } from './ItemSeenObserver';
import type { ListRenderItem } from './List';

type Layout = {
	indexByKey: Map<string, number>;
	keys: string[];
	offsets: number[];
	totalSize: number;
};

type Range = {
	endIndex: number;
	startIndex: number;
};

type Viewport = {
	offset: number;
	size: number;
};

type VirtualizerOptions<ItemT> = {
	data: readonly ItemT[];
	enabled: boolean;
	estimateHeight: number;
	keyExtractor: (item: ItemT, index: number) => string;
	overscanCount: number;
	scrollRoot: React.RefObject<HTMLElement | null> | undefined;
};

type VirtualizerProps<ItemT> = VirtualizerOptions<ItemT> & {
	ref?: Ref<VirtualizerMethods>;
	renderItem: ListRenderItem<ItemT>;
};

export type VirtualizerMethods = {
	scrollToIndex: (options: { index: number; offset?: number }) => boolean;
};

type VirtualizerSnapshot<ItemT> = {
	data: readonly ItemT[];
	enabled: boolean;
	layout: Layout;
	viewport: Viewport;
};

const EMPTY_RANGE: Range = { endIndex: -1, startIndex: 0 };

const createLayout = <ItemT,>({
	data,
	estimateHeight,
	keyExtractor,
	measurements,
}: {
	data: readonly ItemT[];
	estimateHeight: number;
	keyExtractor: (item: ItemT, index: number) => string;
	measurements: Map<string, number>;
}): Layout => {
	const indexByKey = new Map<string, number>();
	const keys: string[] = [];
	const offsets = [0];
	let offset = 0;

	for (let index = 0; index < data.length; index++) {
		const key = keyExtractor(data[index]!, index);
		indexByKey.set(key, index);
		keys.push(key);
		offset += measurements.get(key) ?? estimateHeight;
		offsets.push(offset);
	}

	return {
		indexByKey,
		keys,
		offsets,
		totalSize: offset,
	};
};

// rebuilds the offsets from `fromIndex` onward, reusing the unchanged prefix — a measurement change at index
// k leaves offsets[0..k] untouched and only shifts offsets[k+1..N]. keys and the index map are shared as-is.
const recomputeOffsets = (
	layout: Layout,
	measurements: Map<string, number>,
	estimateHeight: number,
	fromIndex = 0,
): Layout => {
	const { keys } = layout;
	const offsets = layout.offsets.slice(0, fromIndex + 1);
	let offset = offsets[fromIndex]!;

	for (let index = fromIndex; index < keys.length; index++) {
		offset += measurements.get(keys[index]!) ?? estimateHeight;
		offsets.push(offset);
	}

	return { ...layout, offsets, totalSize: offset };
};

const findIndexAtOffset = (layout: Layout, offset: number): number => {
	if (layout.keys.length === 0) {
		return -1;
	}

	let high = layout.keys.length - 1;
	let low = 0;
	let result = 0;

	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		if (layout.offsets[middle]! <= offset) {
			result = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}

	return result;
};

const getRange = ({
	layout,
	overscanCount,
	viewport,
}: {
	layout: Layout;
	overscanCount: number;
	viewport: Viewport;
}): Range => {
	if (layout.keys.length === 0) {
		return EMPTY_RANGE;
	}

	const overscan = Math.max(0, Math.floor(overscanCount));
	const visibleStart = findIndexAtOffset(layout, Math.max(0, viewport.offset));
	const visibleEnd = findIndexAtOffset(
		layout,
		Math.max(0, Math.min(layout.totalSize, viewport.offset + viewport.size)),
	);

	return {
		endIndex: Math.min(layout.keys.length - 1, visibleEnd + overscan),
		startIndex: Math.max(0, visibleStart - overscan),
	};
};

const haveSameKeys = (left: readonly string[], right: readonly string[]): boolean => {
	if (left.length !== right.length) {
		return false;
	}

	for (let index = 0; index < left.length; index++) {
		if (left[index] !== right[index]) {
			return false;
		}
	}

	return true;
};

const haveSameOptions = <ItemT,>(
	left: VirtualizerOptions<ItemT>,
	right: VirtualizerOptions<ItemT>,
): boolean => {
	return (
		left.data === right.data &&
		left.enabled === right.enabled &&
		left.estimateHeight === right.estimateHeight &&
		left.keyExtractor === right.keyExtractor &&
		left.overscanCount === right.overscanCount &&
		left.scrollRoot === right.scrollRoot
	);
};

const getViewportTop = (root: HTMLElement | null): number =>
	root ? root.getBoundingClientRect().top + root.clientTop : 0;

const readViewport = ({
	container,
	scrollRoot,
}: {
	container: HTMLElement;
	scrollRoot: React.RefObject<HTMLElement | null> | undefined;
}): Viewport => {
	const containerRect = container.getBoundingClientRect();
	const root = scrollRoot?.current ?? null;
	const viewportTop = getViewportTop(root);
	const viewportBottom = viewportTop + (root ? root.clientHeight : window.innerHeight);

	// size is the height of the viewport∩container intersection: a list scrolled entirely past the viewport (or
	// one shorter than the viewport) reports 0/partial visible height, not a full viewport. that keeps getRange
	// from rendering a tail of off-screen rows and disables prepend anchoring while the list is out of view.
	return {
		offset: Math.max(0, viewportTop - containerRect.top),
		size: Math.max(
			0,
			Math.min(viewportBottom, containerRect.bottom) - Math.max(viewportTop, containerRect.top),
		),
	};
};

// the observer entry already carries the measured border-box height (matching getBoundingClientRect().height for
// untransformed rows); read it directly instead of forcing a synchronous layout on the hot measurement path.
const readBorderBoxHeight = (entry: ResizeObserverEntry): number => {
	const borderBox = entry.borderBoxSize?.[0];
	return borderBox !== undefined ? borderBox.blockSize : entry.target.getBoundingClientRect().height;
};

const scrollBy = ({
	offset,
	scrollRoot,
}: {
	offset: number;
	scrollRoot: React.RefObject<HTMLElement | null> | undefined;
}) => {
	const root = scrollRoot?.current;
	// 'instant' so compensation scrolls never animate, even under an ancestor `scroll-behavior: smooth`.
	if (root) {
		root.scrollBy({ behavior: 'instant', top: offset });
	} else {
		window.scrollBy({ behavior: 'instant', top: offset });
	}
};

class VirtualizerStore<ItemT> {
	#container: HTMLElement | null = null;
	#emitter = new SimpleEventEmitter<[]>();
	#layout: Layout;
	#measurements = new Map<string, number>();
	#options: VirtualizerOptions<ItemT>;
	#pendingScrollAdjustment = 0;
	#pendingScrollAdjustmentScheduled = false;
	#renderRange: Range;
	#rowKeys = new WeakMap<Element, string>();
	#rowResizeObserver: ResizeObserver | null = null;
	#snapshot: VirtualizerSnapshot<ItemT>;
	#sourceOptions: VirtualizerOptions<ItemT>;
	#viewport: Viewport;

	constructor(options: VirtualizerOptions<ItemT>) {
		this.#options = options;
		this.#sourceOptions = options;
		this.#viewport = {
			offset: 0,
			size: typeof window === 'undefined' ? 0 : window.innerHeight,
		};
		this.#layout = this.#buildLayout();
		this.#renderRange = this.#computeRange();
		this.#snapshot = this.#createSnapshot(options.enabled);
	}

	getSnapshot = (): VirtualizerSnapshot<ItemT> => {
		return this.#snapshot;
	};

	subscribe = (listener: () => void): (() => void) => {
		return this.#emitter.subscribe(listener);
	};

	setOptions(options: VirtualizerOptions<ItemT>): void {
		if (haveSameOptions(this.#sourceOptions, options)) {
			return;
		}
		this.#sourceOptions = options;

		if (!options.enabled) {
			// keep #options (and thus the frozen layout/viewport) pinned to the last enabled render; only
			// #sourceOptions advances so the next real change is still detected once focus returns.
			if (this.#snapshot.enabled) {
				this.#publish(false);
			}
			return;
		}

		const previousLayout = this.#layout;
		const previousViewport = this.#viewport;
		this.#options = options;
		const nextLayout = this.#buildLayout();

		// only anchor when the list occupies the viewport; with size 0 there is no visible row to preserve
		// and compensating would scroll the page while the user is looking at content outside the list.
		if (previousViewport.size > 0 && !haveSameKeys(previousLayout.keys, nextLayout.keys)) {
			const previousAnchorIndex = findIndexAtOffset(previousLayout, previousViewport.offset);
			const anchorKey = previousLayout.keys[previousAnchorIndex];
			const nextAnchorIndex = anchorKey === undefined ? undefined : nextLayout.indexByKey.get(anchorKey);

			if (nextAnchorIndex !== undefined) {
				const offsetWithinAnchor = previousViewport.offset - previousLayout.offsets[previousAnchorIndex]!;
				const nextOffset = nextLayout.offsets[nextAnchorIndex]! + offsetWithinAnchor;
				const scrollAdjustment = nextOffset - previousViewport.offset;
				if (scrollAdjustment !== 0) {
					// prepended rows are still estimate-sized here; defer the scroll to a microtask so it runs after
					// their real heights fold in, scrolling the reconciled total once instead of over-scrolling.
					this.#pendingScrollAdjustment += scrollAdjustment;
					this.#schedulePendingScrollAdjustment();
				}
				this.#viewport = { offset: nextOffset, size: previousViewport.size };
			}
		}

		this.#layout = nextLayout;
		this.#pruneMeasurements();
		this.#publish(true);
	}

	commit(snapshot: VirtualizerSnapshot<ItemT>): void {
		if (snapshot !== this.#snapshot || !snapshot.enabled) {
			return;
		}

		this.#flushPendingScrollAdjustment();
		this.#syncViewport();
	}

	setContainer = (container: HTMLElement | null): void => {
		this.#container = container;
	};

	connect(): () => void {
		const container = this.#container;
		if (!container) {
			return () => {};
		}

		let animationFrame: number | undefined;
		const scheduleSync = () => {
			if (animationFrame !== undefined) {
				return;
			}
			animationFrame = requestAnimationFrame(() => {
				animationFrame = undefined;
				this.#syncViewport();
			});
		};

		const root = this.#options.scrollRoot?.current ?? null;
		const scrollTarget = root ?? window;
		scrollTarget.addEventListener('scroll', scheduleSync, { passive: true });
		window.addEventListener('resize', scheduleSync);

		const resizeObserver = new ResizeObserver(scheduleSync);
		let ancestor: HTMLElement | null = container;
		while (ancestor) {
			resizeObserver.observe(ancestor);
			if (ancestor === root) {
				break;
			}
			ancestor = ancestor.parentElement;
		}
		if (root && ancestor !== root) {
			resizeObserver.observe(root);
		}

		this.#syncViewport();

		return () => {
			if (animationFrame !== undefined) {
				cancelAnimationFrame(animationFrame);
			}
			resizeObserver.disconnect();
			scrollTarget.removeEventListener('scroll', scheduleSync);
			window.removeEventListener('resize', scheduleSync);
		};
	}

	observeRow = (node: HTMLElement, key: string): (() => void) => {
		this.#rowKeys.set(node, key);
		this.#rowResizeObserver ??= new ResizeObserver((entries) => {
			const rows: { key: string; size: number }[] = [];
			for (const entry of entries) {
				const rowKey = this.#rowKeys.get(entry.target);
				if (rowKey !== undefined && entry.target.isConnected) {
					rows.push({
						key: rowKey,
						size: readBorderBoxHeight(entry),
					});
				}
			}
			this.#measureRows(rows);
		});
		this.#rowResizeObserver.observe(node);
		this.#measureRows([{ key, size: node.getBoundingClientRect().height }]);

		return () => {
			this.#rowKeys.delete(node);
			this.#rowResizeObserver?.unobserve(node);
		};
	};

	scrollToIndex = ({ index, offset = 0 }: { index: number; offset?: number }): boolean => {
		if (!this.#snapshot.enabled || !this.#container || index < 0 || index >= this.#layout.keys.length) {
			return false;
		}

		// this absolute scroll defines the position outright, so drop any queued relative prepend adjustment
		// that would otherwise replay on top of it.
		this.#pendingScrollAdjustment = 0;

		const viewport = readViewport({
			container: this.#container,
			scrollRoot: this.#options.scrollRoot,
		});
		const nextOffset = this.#layout.offsets[index]!;
		const viewportTop = getViewportTop(this.#options.scrollRoot?.current ?? null);
		scrollBy({
			offset: this.#container.getBoundingClientRect().top + nextOffset - viewportTop - offset,
			scrollRoot: this.#options.scrollRoot,
		});
		this.#viewport = { offset: Math.max(0, nextOffset - offset), size: viewport.size };
		this.#publish(true);
		return true;
	};

	#syncViewport(): void {
		if (!this.#snapshot.enabled || !this.#container) {
			return;
		}

		const next = readViewport({
			container: this.#container,
			scrollRoot: this.#options.scrollRoot,
		});
		if (
			Math.abs(this.#viewport.offset - next.offset) < 0.5 &&
			Math.abs(this.#viewport.size - next.size) < 0.5
		) {
			return;
		}

		this.#viewport = next;

		// a scroll that stays within the current window advances the viewport but renders the identical row range
		// and spacers; keep the viewport fresh for anchoring but skip the publish (and thus the React render).
		const range = this.#computeRange();
		if (range.startIndex === this.#renderRange.startIndex && range.endIndex === this.#renderRange.endIndex) {
			return;
		}

		this.#publish(true);
	}

	// applies and clears the queued prepend scroll; the accumulator is zeroed before scrolling so a
	// re-entrant scroll event cannot replay it.
	#flushPendingScrollAdjustment(): void {
		const scrollAdjustment = this.#pendingScrollAdjustment;
		this.#pendingScrollAdjustment = 0;

		if (scrollAdjustment === 0 || !this.#snapshot.enabled || !this.#container) {
			return;
		}

		scrollBy({ offset: scrollAdjustment, scrollRoot: this.#options.scrollRoot });
	}

	// drains the pending scroll on a microtask, after React's commit stack has folded the prepended rows'
	// real heights into the total — unlike commit(), which bails once a measurement publish moves the snapshot.
	#schedulePendingScrollAdjustment(): void {
		if (this.#pendingScrollAdjustmentScheduled) {
			return;
		}

		this.#pendingScrollAdjustmentScheduled = true;
		queueMicrotask(() => {
			this.#pendingScrollAdjustmentScheduled = false;
			this.#flushPendingScrollAdjustment();
			this.#syncViewport();
		});
	}

	#buildLayout(): Layout {
		return createLayout({
			data: this.#options.data,
			estimateHeight: this.#options.estimateHeight,
			keyExtractor: this.#options.keyExtractor,
			measurements: this.#measurements,
		});
	}

	#computeRange(): Range {
		return getRange({
			layout: this.#layout,
			overscanCount: this.#options.overscanCount,
			viewport: this.#viewport,
		});
	}

	#createSnapshot(enabled: boolean): VirtualizerSnapshot<ItemT> {
		return {
			data: this.#options.data,
			enabled,
			layout: this.#layout,
			viewport: this.#viewport,
		};
	}

	#measureRows(rows: readonly { key: string; size: number }[]): void {
		if (!this.#snapshot.enabled) {
			return;
		}

		let minChangedIndex = Infinity;
		let scrollAdjustment = 0;

		for (const { key, size } of rows) {
			if (size < 0) {
				continue;
			}

			const previousSize = this.#measurements.get(key) ?? this.#options.estimateHeight;
			if (Math.abs(previousSize - size) < 0.5) {
				continue;
			}

			const index = this.#layout.indexByKey.get(key);
			if (index === undefined) {
				continue;
			}

			const delta = size - previousSize;
			// compensate for any row starting above the viewport top, including one straddling it: its growth
			// pushes the anchor down by the full delta. testing the row's end instead would skip the straddling
			// row and let the anchor drift by that row's estimate-vs-measured difference.
			if (this.#layout.offsets[index]! < this.#viewport.offset) {
				scrollAdjustment += delta;
			}

			this.#measurements.set(key, size);
			if (index < minChangedIndex) {
				minChangedIndex = index;
			}
		}

		if (minChangedIndex === Infinity) {
			return;
		}

		if (scrollAdjustment !== 0) {
			// while a prepend drain is queued, fold this delta into the pending total: scrolling now against the
			// not-yet-applied prepend position gets clamped away, so let the microtask apply the total once.
			if (this.#pendingScrollAdjustmentScheduled) {
				this.#pendingScrollAdjustment += scrollAdjustment;
			} else {
				scrollBy({ offset: scrollAdjustment, scrollRoot: this.#options.scrollRoot });
			}
			this.#viewport = {
				offset: Math.max(0, this.#viewport.offset + scrollAdjustment),
				size: this.#viewport.size,
			};
		}

		this.#layout = recomputeOffsets(
			this.#layout,
			this.#measurements,
			this.#options.estimateHeight,
			minChangedIndex,
		);
		this.#publish(true);
	}

	#pruneMeasurements(): void {
		if (this.#measurements.size <= this.#layout.keys.length * 2) {
			return;
		}

		const activeKeys = new Set(this.#layout.keys);
		for (const key of this.#measurements.keys()) {
			if (!activeKeys.has(key)) {
				this.#measurements.delete(key);
			}
		}
	}

	#publish(enabled: boolean): void {
		this.#renderRange = this.#computeRange();
		this.#snapshot = this.#createSnapshot(enabled);
		this.#emitter.emit();
	}
}

/**
 * renders only the contiguous item range around the active scroll viewport and preserves the first visible
 * keyed item when rows are prepended or removed.
 *
 * @param props virtualized list data, rendering, measurement, focus, and scrolling options
 * @returns the active row range bracketed by size-preserving spacers
 */
export function Virtualizer<ItemT>({
	data,
	enabled,
	estimateHeight,
	keyExtractor,
	overscanCount,
	ref,
	renderItem,
	scrollRoot,
}: VirtualizerProps<ItemT>) {
	const store = useConstant(
		() => new VirtualizerStore({ data, enabled, estimateHeight, keyExtractor, overscanCount, scrollRoot }),
	);
	const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

	useImperativeHandle(ref, () => ({ scrollToIndex: store.scrollToIndex }), [store]);

	useLayoutEffect(() => {
		store.setOptions({ data, enabled, estimateHeight, keyExtractor, overscanCount, scrollRoot });
	}, [data, enabled, estimateHeight, keyExtractor, overscanCount, scrollRoot, store]);

	useLayoutEffect(() => {
		store.commit(snapshot);
	}, [snapshot, store]);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		return store.connect();
	}, [enabled, scrollRoot, store]);

	const range = getRange({ layout: snapshot.layout, overscanCount, viewport: snapshot.viewport });
	const rows: ReactNode[] = [];

	for (let index = range.startIndex; index <= range.endIndex; index++) {
		const item = snapshot.data[index]!;
		const key = snapshot.layout.keys[index]!;
		rows.push(
			<VirtualRow
				key={key}
				enabled={snapshot.enabled}
				index={index}
				item={item}
				itemKey={key}
				observeRow={store.observeRow}
				renderItem={renderItem}
			/>,
		);
	}

	const beforeSize = snapshot.layout.offsets[range.startIndex] ?? 0;
	const afterSize =
		range.endIndex === -1
			? snapshot.layout.totalSize
			: snapshot.layout.totalSize - snapshot.layout.offsets[range.endIndex + 1]!;

	return (
		<div ref={(node) => store.setContainer(node)} className={css.virtualizer}>
			<div aria-hidden className={css.spacer} style={{ height: beforeSize }} />
			{rows}
			<div aria-hidden className={css.spacer} style={{ height: afterSize }} />
		</div>
	);
}

type VirtualRowProps<ItemT> = {
	enabled: boolean;
	index: number;
	item: ItemT;
	itemKey: string;
	observeRow: (node: HTMLElement, key: string) => () => void;
	renderItem: ListRenderItem<ItemT>;
};

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `memo` erases the type parameter
const VirtualRow = memo(function VirtualRow<ItemT>({
	enabled,
	index,
	item,
	itemKey,
	observeRow,
	renderItem,
}: VirtualRowProps<ItemT>) {
	const seen = use(ItemSeenContext);

	const setRow = (node: HTMLDivElement | null) => {
		if (!enabled || node === null) {
			return;
		}

		return unregister([observeRow(node, itemKey), seen?.register(node, item)]);
	};

	return (
		<div ref={setRow} className={css.row}>
			{renderItem({ index, item })}
		</div>
	);
}) as <ItemT>(props: VirtualRowProps<ItemT>) => ReactNode;

const noop = () => {};

const cleanup = (fns: Array<() => void>) => {
	for (let idx = 0, len = fns.length; idx < len; idx++) {
		const fn = fns[idx]!;
		fn();
	}
};

const unregister = (fns: Array<(() => void) | FalsyValue>): (() => void) => {
	const cleanups = definite(fns);

	if (cleanups.length === 0) {
		return noop;
	}
	if (cleanups.length === 1) {
		return cleanups[0]!;
	}

	return cleanup.bind(null, cleanups);
};
