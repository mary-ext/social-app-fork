import {
	type ComponentPropsWithoutRef,
	type ReactNode,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import {
	ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft,
	ArrowRight_Stroke2_Corner0_Rounded as ArrowRight,
} from '#/components/icons/Arrow';
import * as css from '#/components/TabScroller.css';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

/** Pixels scrolled per edge-button click. */
const SCROLL_STEP = 200;
/** Pixels scrolled per frame while an edge button is held. */
const CONTINUOUS_SCROLL_SPEED = 6;
/** Hold this long before a press turns into a continuous scroll. */
const CONTINUOUS_SCROLL_DELAY = 500;

/**
 * Horizontally-scrolling row of pills. Owns the scroll mechanics — drag-to-scroll, hidden scrollbar, edge
 * fade/scroll buttons, and centering the active pill into view — while the pills themselves are supplied as
 * {@link Tab} children. Mark the selected child with `active`, and pass its key as `activeKey` so the row
 * re-centers when the selection changes.
 */
export function Root({
	activeKey,
	children,
	gutterWidth = space.lg,
}: {
	/** Key of the active tab; changing it re-centers the `active` pill into view. */
	activeKey: string;
	children: ReactNode;
	/** Horizontal inset of the scroller and its edge fades. */
	gutterWidth?: number;
}) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const syncAffordances = useEffectEvent(() => {
		const el = scrollerRef.current;
		if (!el) {
			return;
		}
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth - 1);
	});

	// track whether either edge can scroll, both as the row scrolls and as its size changes
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) {
			return;
		}
		el.addEventListener('scroll', syncAffordances, { passive: true });
		const observer = new ResizeObserver(syncAffordances);
		observer.observe(el);
		return () => {
			el.removeEventListener('scroll', syncAffordances);
			observer.disconnect();
		};
	}, []);

	// re-sync after every commit so a changing tab set (which grows content without resizing the row) is caught
	useEffect(() => {
		syncAffordances();
	});

	// center the active pill — scoped to the row's own scrollLeft so it doesn't nudge ancestors (e.g. the page)
	useEffect(() => {
		const el = scrollerRef.current;
		const active = el?.querySelector('[data-active="true"]');
		if (!el || !active) {
			return;
		}
		const rowRect = el.getBoundingClientRect();
		const tabRect = active.getBoundingClientRect();
		const dx = tabRect.left + tabRect.width / 2 - (rowRect.left + rowRect.width / 2);
		if (dx !== 0) {
			el.scrollBy({ behavior: 'smooth', left: dx });
		}
	}, [activeKey]);

	// click-and-drag to scroll, since the scrollbar is hidden and a trackpad/shift-wheel isn't always available
	useEffect(() => {
		const row = scrollerRef.current;
		if (!row) {
			return;
		}
		let isPressed = false;
		let isDragging = false;
		let startX = 0;
		let startScrollLeft = 0;

		const onMouseDown = (e: MouseEvent) => {
			isPressed = true;
			startX = e.pageX;
			startScrollLeft = row.scrollLeft;
		};
		const onMouseMove = (e: MouseEvent) => {
			if (!isPressed) {
				return;
			}
			const walk = e.pageX - startX;
			if (!isDragging && Math.abs(walk) < 3) {
				return;
			}
			isDragging = true;
			e.preventDefault();
			row.scrollLeft = startScrollLeft - walk;
		};
		const onMouseUp = () => {
			if (isDragging) {
				// swallow the trailing click so a drag that lands on a pill doesn't select it
				row.addEventListener('click', (e) => e.stopPropagation(), { capture: true, once: true });
			}
			isPressed = false;
			isDragging = false;
		};

		row.addEventListener('mousedown', onMouseDown);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		return () => {
			row.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, []);

	const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const holdFrame = useRef<number | null>(null);

	const stopContinuousScroll = () => {
		if (holdTimeout.current != null) {
			clearTimeout(holdTimeout.current);
			holdTimeout.current = null;
		}
		if (holdFrame.current != null) {
			cancelAnimationFrame(holdFrame.current);
			holdFrame.current = null;
		}
	};

	const scrollByStep = (direction: 'left' | 'right') => {
		scrollerRef.current?.scrollBy({
			behavior: 'smooth',
			left: direction === 'left' ? -SCROLL_STEP : SCROLL_STEP,
		});
	};

	const startContinuousScroll = (direction: 'left' | 'right') => {
		stopContinuousScroll();
		holdTimeout.current = setTimeout(() => {
			const step = () => {
				const el = scrollerRef.current;
				if (!el) {
					return;
				}
				el.scrollLeft += direction === 'left' ? -CONTINUOUS_SCROLL_SPEED : CONTINUOUS_SCROLL_SPEED;
				holdFrame.current = requestAnimationFrame(step);
			};
			holdFrame.current = requestAnimationFrame(step);
		}, CONTINUOUS_SCROLL_DELAY);
	};

	useEffect(() => stopContinuousScroll, []);

	return (
		<div className={css.outer} style={assignInlineVars({ [css.gutterVar]: `${gutterWidth}px` })}>
			<div className={css.scroller} ref={scrollerRef}>
				{children}
			</div>
			{canScrollLeft && (
				<div className={css.edgeLeft}>
					<Button
						className={css.edgeButton}
						color="secondary"
						label={m['common.a11y.scrollLeft']()}
						onClick={() => scrollByStep('left')}
						onPointerDown={() => startContinuousScroll('left')}
						onPointerLeave={stopContinuousScroll}
						onPointerUp={stopContinuousScroll}
						shape="round"
						variant="outline"
					>
						<ButtonIcon icon={ArrowLeft} />
					</Button>
				</div>
			)}
			{canScrollRight && (
				<div className={css.edgeRight}>
					<Button
						className={css.edgeButton}
						color="secondary"
						label={m['common.a11y.scrollRight']()}
						onClick={() => scrollByStep('right')}
						onPointerDown={() => startContinuousScroll('right')}
						onPointerLeave={stopContinuousScroll}
						onPointerUp={stopContinuousScroll}
						shape="round"
						variant="outline"
					>
						<ButtonIcon icon={ArrowRight} />
					</Button>
				</div>
			)}
		</div>
	);
}

/**
 * A pill inside a {@link Root}. Renders a `<button>` carrying the shared pill styling; pass its content as
 * children and its click/aria handlers as regular button props.
 */
export function Tab({
	active = false,
	children,
	className,
	...props
}: { active?: boolean; children: ReactNode } & ComponentPropsWithoutRef<'button'>) {
	return (
		<button {...props} className={clsx(css.tab({ active }), className)} data-active={active} type="button">
			{children}
		</button>
	);
}
