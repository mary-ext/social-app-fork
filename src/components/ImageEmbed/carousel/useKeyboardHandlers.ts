import { type RefObject, useEffect } from 'react';

import { getReducedMotion } from '#/lib/browser/reduced-motion';

/**
 * adds arrow-key paging to a scroll-snapping carousel.
 *
 * @param itemRefsRef tiles by index
 * @param onActivate called before scrolling to an index
 * @param scrollPaddingLeft left scroll padding in px
 * @param scrollRef scrollable tile container
 */
export function useKeyboardHandlers({
	itemRefsRef,
	onActivate,
	scrollPaddingLeft,
	scrollRef,
}: {
	itemRefsRef: RefObject<Map<number, HTMLElement>>;
	onActivate: (index: number) => void;
	scrollPaddingLeft: number;
	scrollRef: RefObject<HTMLElement | null>;
}) {
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}

		const onKeyDown = (e: KeyboardEvent) => {
			let step: number;
			switch (e.key) {
				case 'ArrowLeft': {
					step = -1;
					break;
				}
				case 'ArrowRight': {
					step = 1;
					break;
				}
				default: {
					return;
				}
			}

			// focus is the source of truth because pointer scrolling does not update an index.
			let current: number | undefined;
			for (const [index, node] of itemRefsRef.current) {
				if (node.contains(document.activeElement)) {
					current = index;
					break;
				}
			}
			if (current === undefined) {
				return;
			}

			const targetIndex = current + step;
			const target = itemRefsRef.current.get(targetIndex);
			if (!target) {
				return;
			}

			e.preventDefault();

			// account for the strip's left scroll padding.
			const left = target.offsetLeft - scrollPaddingLeft;

			onActivate(targetIndex);
			el.scrollTo({ behavior: getReducedMotion() ? 'instant' : 'smooth', left });
		};

		el.addEventListener('keydown', onKeyDown);
		return () => {
			el.removeEventListener('keydown', onKeyDown);
		};
	}, [itemRefsRef, onActivate, scrollPaddingLeft, scrollRef]);
}
