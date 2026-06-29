import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import {
	ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft,
	ArrowRight_Stroke2_Corner0_Rounded as ArrowRight,
} from '#/components/icons/Arrow';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as css from '#/components/web/InterestTabs.css';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

/** Pixels scrolled per edge-button click. */
const SCROLL_STEP = 200;
/** Pixels scrolled per frame while an edge button is held. */
const CONTINUOUS_SCROLL_SPEED = 6;
/** Hold this long before a press turns into a continuous scroll. */
const CONTINUOUS_SCROLL_DELAY = 500;

/**
 * Horizontally-scrolling row of category pills, scrolling the selected pill into view. Used for the interests
 * picker on the Explore screen and the find-follows flow.
 */
export function InterestTabs({
	disabled,
	gutterWidth = space.lg,
	interests,
	interestsDisplayNames,
	onSelectTab,
	selectedInterest,
}: {
	/** Still allows changing tab, but removes the active state from the selected tab. */
	disabled?: boolean;
	gutterWidth?: number;
	interests: string[];
	interestsDisplayNames: Record<string, string>;
	onSelectTab: (tab: string) => void;
	selectedInterest: string;
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

	// track whether either edge can scroll, both as the row scrolls and as its size/content changes
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) {
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
	}, [interests]);

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
	}, [selectedInterest, interests]);

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
				{interests.map((interest) => {
					const active = interest === selectedInterest && !disabled;
					const displayName = interestsDisplayNames[interest]!;
					return (
						<button
							aria-label={
								active
									? m['components.web.category.a11y.active']({ name: displayName })
									: m['components.web.category.a11y.select']({ name: displayName })
							}
							className={css.tab({ active })}
							data-active={active}
							key={interest}
							onClick={() => onSelectTab(interest)}
							type="button"
						>
							<Text className={css.tabLabel} size="md_sub" weight="medium">
								{displayName}
							</Text>
						</button>
					);
				})}
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
