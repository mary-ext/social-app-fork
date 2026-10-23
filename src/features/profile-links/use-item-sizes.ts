import { useEffect, useState } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import type { Size } from './row-layout';

/**
 * measures a row and items identified by `data-item-key`. the row must have no item key.
 *
 * @returns row width, column gap, keyed item sizes, and an observation ref callback
 */
export const useItemSizes = () => {
	const [row, setRow] = useState({ gap: 0, width: 0 });
	const [sizes, setSizes] = useState<Record<string, Size>>({});

	// layout dimensions exclude transforms such as the dialog's opening animation.
	const observer = useConstant(() => {
		return new ResizeObserver((entries) => {
			const updates: Record<string, Size> = {};
			for (const { target } of entries) {
				if (!(target instanceof HTMLElement)) {
					continue;
				}
				const key = target.dataset.itemKey;
				if (key === undefined) {
					const width = target.clientWidth;
					const gap = parseFloat(getComputedStyle(target).columnGap) || 0;
					setRow((prev) => {
						return prev.gap === gap && prev.width === width ? prev : { gap, width };
					});
				} else {
					updates[key] = { h: target.offsetHeight, w: target.offsetWidth };
				}
			}
			setSizes((prev) => {
				const unchanged = Object.entries(updates).every(([key, size]) => {
					return prev[key]?.w === size.w && prev[key]?.h === size.h;
				});
				return unchanged ? prev : { ...prev, ...updates };
			});
		});
	});
	useEffect(() => {
		return () => observer.disconnect();
	}, [observer]);

	const observe = (el: HTMLElement | null) => {
		if (el) {
			observer.observe(el);
		}
	};

	return { gap: row.gap, observe, rowWidth: row.width, sizes };
};
