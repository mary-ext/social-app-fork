import { createContext, useEffect, type ReactNode } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

type SeenObserver = {
	connect(root: HTMLElement | null): () => void;
	register(node: Element, item: unknown): () => void;
};

export const ItemSeenContext = createContext<SeenObserver | null>(null);

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- binds `onItemSeen`'s parameter to the list's element type; inlining it to `unknown` would flip the callback's variance
export function ItemSeenObserver<ItemT>({
	children,
	enabled,
	onItemSeen,
	root,
}: {
	children: ReactNode;
	enabled: boolean;
	onItemSeen: (item: ItemT) => void;
	root: React.RefObject<HTMLElement | null> | undefined;
}) {
	const reportSeen = useNonReactiveCallback(onItemSeen);

	const api = useConstant(() => {
		const rows = new Map<Element, { item: ItemT; timeout?: ReturnType<typeof setTimeout> }>();

		let observer: IntersectionObserver | null = null;

		return {
			connect(rootEl: HTMLElement | null) {
				observer = new IntersectionObserver(
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
						root: rootEl,
						rootMargin: '-200px 0px -200px 0px',
					},
				);

				for (const node of rows.keys()) {
					observer.observe(node);
				}

				return () => {
					observer?.disconnect();
					observer = null;

					for (const row of rows.values()) {
						if (row.timeout != null) {
							clearTimeout(row.timeout);
							row.timeout = undefined;
						}
					}
				};
			},

			register(node: Element, item: ItemT) {
				rows.set(node, { item });
				observer?.observe(node);

				return () => {
					const row = rows.get(node);
					if (row !== undefined) {
						clearTimeout(row.timeout);
						rows.delete(node);
					}

					observer?.unobserve(node);
				};
			},
		};
	});

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return api.connect(root?.current ?? null);
	}, [api, enabled, root]);

	return <ItemSeenContext value={api}>{children}</ItemSeenContext>;
}
