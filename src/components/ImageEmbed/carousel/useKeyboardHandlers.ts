import { useEffect } from 'react';

import { tween } from '#/components/ImageEmbed/carousel/tween';
import { getOffsetForIndex } from '#/components/ImageEmbed/carousel/utils';

const SETTLE_DURATION = 700;

/**
 * Arrow-key paging for the image carousel when focus is inside it. Tweens to the neighbouring item and
 * reports the settled index. Operates directly on the scroll element returned by `getScrollEl`.
 */
export function useKeyboardHandlers({
	getScrollEl,
	itemWidthsRef,
	currentIndexRef,
	scrollTo,
	onSettle,
	imageCount,
}: {
	getScrollEl: () => HTMLElement | null;
	itemWidthsRef: React.RefObject<Map<number, number>>;
	currentIndexRef: React.RefObject<number>;
	scrollTo: (offset: number) => void;
	onSettle: (index: number) => void;
	imageCount: number;
}) {
	useEffect(() => {
		if (imageCount <= 1) return;

		let stopTween: (() => void) | null = null;
		let pendingIndex: number | null = null;

		const onKeyDown = (e: KeyboardEvent) => {
			const el = getScrollEl();
			if (!el || !el.contains(document.activeElement)) return;

			const current = pendingIndex ?? currentIndexRef.current;
			let targetIndex: number | undefined;

			if (e.key === 'ArrowRight') {
				if (current < imageCount - 1) {
					targetIndex = current + 1;
				}
			} else if (e.key === 'ArrowLeft') {
				if (current > 0) {
					targetIndex = current - 1;
				}
			}

			if (targetIndex != null) {
				e.preventDefault();

				if (stopTween) {
					stopTween();
					stopTween = null;
				}

				pendingIndex = targetIndex;
				const from = el.scrollLeft;
				const to = getOffsetForIndex(itemWidthsRef.current, targetIndex);
				const idx = targetIndex;

				stopTween = tween(
					from,
					to,
					SETTLE_DURATION,
				)(
					(v) => {
						scrollTo(v);
					},
					() => {
						stopTween = null;
						pendingIndex = null;
						onSettle(idx);
					},
				);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			if (stopTween) stopTween();
		};
	}, [getScrollEl, itemWidthsRef, currentIndexRef, scrollTo, onSettle, imageCount]);
}
