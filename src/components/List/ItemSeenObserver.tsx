import { createContext, useEffect, type ReactNode } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

type SeenObserver = {
	disconnect(): void;
	register(node: Element, item: unknown): void;
	unregister(node: Element): void;
};

export const ItemSeenContext = createContext<SeenObserver | null>(null);

export function ItemSeenObserver<ItemT>({
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
						}, 500);
					} else if (row.timeout != null) {
						clearTimeout(row.timeout);
						row.timeout = undefined;
					}
				}
			},
			{
				root: root?.current ?? null,
				rootMargin: '-200px 0px -200px 0px',
			},
		);

		return {
			disconnect() {
				observer.disconnect();
				rows.forEach((row) => {
					if (row.timeout != null) {
						clearTimeout(row.timeout);
					}
				});
			},
			register(node: Element, item: ItemT) {
				rows.set(node, { item });
				observer.observe(node);
			},
			unregister(node: Element) {
				const row = rows.get(node);
				if (row?.timeout != null) {
					clearTimeout(row.timeout);
				}
				rows.delete(node);
				observer.unobserve(node);
			},
		};
	});

	useEffect(() => {
		return seen.disconnect;
	}, [seen]);

	return <ItemSeenContext value={seen}>{children}</ItemSeenContext>;
}
