import { type RefObject, useEffect, useEffectEvent } from 'react';

import { getTiles, scrollToTile } from '#/components/ImageEmbed/carousel/tiles';

/**
 * adds arrow-key paging with roving focus.
 *
 * @param options paging configuration
 * @returns the active-tile setter
 */
export function useKeyboardPaging({
	scrollPaddingLeft,
	scrollRef,
}: {
	scrollPaddingLeft: number;
	scrollRef: RefObject<HTMLElement | null>;
}) {
	const setActiveTile = (index: number) => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		getTiles(el).forEach((tile, i) => {
			tile.tabIndex = i === index ? 0 : -1;
		});
	};

	const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
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

		const el = scrollRef.current;
		if (!el) {
			return;
		}

		const tiles = getTiles(el);
		const current = tiles.findIndex((tile) => tile.contains(document.activeElement));
		if (current === -1) {
			return;
		}

		const tile = tiles[current + step];
		if (!tile) {
			return;
		}

		e.preventDefault();

		setActiveTile(current + step);
		tile.focus({ preventScroll: true });
		scrollToTile({ el, scrollPaddingLeft, tile });
	});

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}

		el.addEventListener('keydown', onKeyDown);
		return () => {
			el.removeEventListener('keydown', onKeyDown);
		};
	}, [scrollRef]);

	return { setActiveTile };
}
