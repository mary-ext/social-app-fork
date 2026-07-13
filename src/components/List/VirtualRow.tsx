import {
	createContext,
	memo,
	type ReactNode,
	startTransition,
	use,
	useEffect,
	useRef,
	useState,
} from 'react';

import { useIsFocused } from '@react-navigation/native';

import { useConstant } from '#/lib/hooks/use-constant';

import * as css from '#/components/List/List.css';

import { ItemSeenContext } from './ItemSeenObserver';
import type { RowProps } from './Row';

/** fraction of the root height kept mounted beyond the viewport on each side before a row is unmounted. */
export const overscanRatio = 0.75;

type VirtualRowObserverApi = {
	connect(root: HTMLElement | null): void;
	disconnect(): void;
	register(node: Element, onIntersect: (entry: IntersectionObserverEntry) => void): void;
	unregister(node: Element): void;
};

export const VirtualRowContext = createContext<VirtualRowObserverApi | null>(null);

/**
 * provides a single `IntersectionObserver` shared by every {@link VirtualRow} beneath it, so mount/unmount
 * decisions are made against the list's own scroll root rather than a per-row observer.
 */
export function VirtualRowObserver({
	children,
	root,
}: {
	children: ReactNode;
	root: React.RefObject<HTMLElement | null> | undefined;
}) {
	const api = useConstant((): VirtualRowObserverApi => {
		const handlers = new Map<Element, (entry: IntersectionObserverEntry) => void>();

		let rootNode: HTMLElement | null = null;
		let observer: IntersectionObserver | null = null;
		let resize: ResizeObserver | null = null;
		let rootHeight: number | undefined;

		const rebuild = () => {
			const height = rootNode ? rootNode.clientHeight : window.innerHeight;
			if (height === rootHeight) {
				return;
			}

			rootHeight = height;

			observer?.disconnect();
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						const handler = handlers.get(entry.target);
						handler?.(entry);
					}
				},
				{
					root: rootNode,
					rootMargin: `${overscanRatio * rootHeight}px 0px`,
				},
			);

			for (const node of handlers.keys()) {
				observer.observe(node);
			}
		};

		return {
			connect(rootEl) {
				rootNode = rootEl;
				rebuild();

				if (rootEl !== null) {
					resize = new ResizeObserver(rebuild);
					resize.observe(rootEl);
				} else {
					window.addEventListener('resize', rebuild);
				}
			},
			disconnect() {
				observer?.disconnect();

				if (rootNode !== null) {
					resize?.disconnect();
				} else {
					window.removeEventListener('resize', rebuild);
				}

				observer = null;
				resize = null;
				rootNode = null;
				rootHeight = undefined;
			},

			register(node, onIntersect) {
				handlers.set(node, onIntersect);
				observer?.observe(node);
			},
			unregister(node) {
				handlers.delete(node);
				observer?.unobserve(node);
			},
		};
	});

	useEffect(() => {
		api.connect(root?.current ?? null);
		return () => api.disconnect();
	}, [api, root]);

	return <VirtualRowContext value={api}>{children}</VirtualRowContext>;
}

export type VirtualRowProps<ItemT> = RowProps<ItemT> & {
	estimateHeight: number;
	/** mount the content on first render instead of waiting for the observer, for rows known to start on screen. */
	initialVisible?: boolean;
};

/**
 * a row that mounts its content only while near the viewport and collapses to a fixed-height placeholder
 * otherwise, trading a possible one-frame blank on scroll-in for not paying the mount cost of off-screen
 * rows.
 */
export const VirtualRow = memo(function VirtualRow<ItemT>({
	estimateHeight,
	index,
	initialVisible = false,
	item,
	renderItem,
}: VirtualRowProps<ItemT>) {
	const seen = use(ItemSeenContext);
	const observer = use(VirtualRowContext)!;

	const isFocused = useIsFocused();

	const [visible, setVisible] = useState(initialVisible);
	const [height, setHeight] = useState(estimateHeight);
	const visibleRef = useRef(initialVisible);

	const setNode = (node: Element | null) => {
		if (!isFocused || node === null) {
			return;
		}

		observer.register(node, (entry: IntersectionObserverEntry) => {
			const next = entry.isIntersecting;
			if (visibleRef.current === next) {
				return;
			}

			visibleRef.current = next;

			if (next) {
				setVisible(true);
			} else {
				setHeight(entry.boundingClientRect.height);
				startTransition(() => setVisible(false));
			}
		});

		seen?.register(node, item);

		return () => {
			observer.unregister(node);
			seen?.unregister(node);
		};
	};

	return (
		<div className={css.row} ref={setNode} style={{ height: visible ? undefined : height }}>
			{visible ? renderItem({ index, item }) : null}
		</div>
	);
}) as <ItemT>(props: VirtualRowProps<ItemT>) => ReactNode;
