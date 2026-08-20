import { type RefObject, useEffect, useEffectEvent, useState } from 'react';

import { clsx } from 'clsx';

import { useMediaQuery } from '#/lib/browser/media-query';

import * as styles from '#/components/ImageEmbed/carousel/PagingControls.css';
import { getTileOffset, getTiles, scrollToTile } from '#/components/ImageEmbed/carousel/tiles';

import ArrowLeftIcon from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import ArrowRightIcon from '#/icons/central/ArrowRight_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const MOUSE_QUERY = '(hover: hover) and (pointer: fine)';

// scroll snapping can stop at subpixel offsets
const SCROLL_EPSILON = 1;

type PagingProps = {
	onPage?: (index: number) => void;
	scrollPaddingLeft: number;
	scrollRef: RefObject<HTMLElement | null>;
};

/**
 * renders mouse paging controls for a scroll-snapping carousel.
 *
 * @param props paging configuration
 * @returns paging controls, or `null` when paging is unavailable
 */
export function PagingControls({ onPage, scrollPaddingLeft, scrollRef }: PagingProps) {
	const { canLeft, canRight, page } = usePaging({ onPage, scrollPaddingLeft, scrollRef });

	if (!canLeft && !canRight) {
		return null;
	}

	return (
		<>
			<button
				type="button"
				className={clsx(styles.navButton, styles.navLeft)}
				aria-label={m['common.a11y.previousImage']()}
				disabled={!canLeft}
				tabIndex={-1}
				onClick={() => page(-1)}
			>
				<ArrowLeftIcon className={styles.navIcon} />
			</button>
			<button
				type="button"
				className={clsx(styles.navButton, styles.navRight)}
				aria-label={m['common.a11y.nextImage']()}
				disabled={!canRight}
				tabIndex={-1}
				onClick={() => page(1)}
			>
				<ArrowRightIcon className={styles.navIcon} />
			</button>
		</>
	);
}

function usePaging({ onPage, scrollPaddingLeft, scrollRef }: PagingProps) {
	const canHover = useMediaQuery(MOUSE_QUERY);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	const page = (step: -1 | 1) => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}

		const isAhead = (tile: HTMLElement) => {
			const offset = getTileOffset(tile, scrollPaddingLeft);
			return step === 1 ? offset > el.scrollLeft + SCROLL_EPSILON : offset < el.scrollLeft - SCROLL_EPSILON;
		};

		const tiles = getTiles(el);
		const index = step === 1 ? tiles.findIndex(isAhead) : tiles.findLastIndex(isAhead);
		const tile = tiles[index];
		if (!tile) {
			return;
		}

		onPage?.(index);
		scrollToTile({ el, scrollPaddingLeft, tile });
	};

	const syncAffordances = useEffectEvent(() => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		setCanLeft(el.scrollLeft > SCROLL_EPSILON);
		setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - SCROLL_EPSILON);
	});

	useEffect(() => {
		const el = scrollRef.current;
		if (!el || !canHover) {
			return;
		}

		syncAffordances();
		el.addEventListener('scroll', syncAffordances, { passive: true });
		const observer = new ResizeObserver(syncAffordances);
		observer.observe(el);

		return () => {
			el.removeEventListener('scroll', syncAffordances);
			observer.disconnect();
		};
	}, [canHover, scrollRef]);

	return { canLeft, canRight, page };
}
