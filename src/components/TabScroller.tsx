import {
	type ComponentPropsWithoutRef,
	type PointerEvent,
	type ReactNode,
	type RefObject,
	useEffect,
	useEffectEvent,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as css from '#/components/TabScroller.css';
import { Text, type TextProps } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import ArrowLeft from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import ArrowRight from '#/icons/central/ArrowRight_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

// pixels per click
const SCROLL_STEP = 200;
// pixels per animation frame
const CONTINUOUS_SCROLL_SPEED = 6;
// milliseconds before hold scrolling starts
const CONTINUOUS_SCROLL_DELAY = 500;
// pixels before a press counts as a drag
const DRAG_THRESHOLD = 3;

/**
 * horizontally scrollable pills; centers the initially active pill on mount.
 *
 * @param props pills and horizontal gutter width
 * @returns the pill scroller and arrow controls
 */
export function Root({
	children,
	gutterWidth = space.lg,
}: {
	children: ReactNode;
	/** horizontal inset in pixels, shared by the pills and edge fades. */
	gutterWidth?: number;
}) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const syncArrows = useEffectEvent(() => {
		const row = scrollerRef.current;
		if (!row) {
			return;
		}

		setCanScrollLeft(row.scrollLeft > 1);
		setCanScrollRight(Math.ceil(row.scrollLeft) < row.scrollWidth - row.clientWidth - 1);
	});

	useEffect(() => {
		const row = scrollerRef.current;
		if (!row) {
			return;
		}

		row.addEventListener('scroll', syncArrows, { passive: true });

		const observer = new ResizeObserver(syncArrows);
		observer.observe(row);

		return () => {
			row.removeEventListener('scroll', syncArrows);
			observer.disconnect();
		};
	}, []);

	// tab changes can alter scroll width without triggering the row's ResizeObserver
	useLayoutEffect(() => {
		syncArrows();
	});

	// change only this row's scroll position, not its scrollable ancestors
	useLayoutEffect(() => {
		const row = scrollerRef.current;
		const active = row?.querySelector('[data-active]');
		if (!row || !active) {
			return;
		}

		const rowRect = row.getBoundingClientRect();
		const tabRect = active.getBoundingClientRect();

		row.scrollLeft += tabRect.left + tabRect.width / 2 - (rowRect.left + rowRect.width / 2);
	}, []);

	// mouse dragging provides scrolling without a scrollbar or trackpad
	useEffect(() => {
		const row = scrollerRef.current;
		if (!row) {
			return;
		}
		let pressed = false;
		let dragging = false;
		let suppressClick = false;
		let startX = 0;
		let startScrollLeft = 0;

		const onMouseDown = (event: MouseEvent) => {
			// a drag released outside the row must not suppress the next click
			suppressClick = false;
			if (event.button !== 0) {
				return;
			}
			pressed = true;
			startX = event.pageX;
			startScrollLeft = row.scrollLeft;
		};
		const onMouseMove = (event: MouseEvent) => {
			if (!pressed) {
				return;
			}
			// the button was released outside the window
			if (!(event.buttons & 1)) {
				pressed = false;
				dragging = false;
				return;
			}
			const walk = event.pageX - startX;
			if (!dragging && Math.abs(walk) < DRAG_THRESHOLD) {
				return;
			}
			dragging = true;
			event.preventDefault();
			row.scrollLeft = startScrollLeft - walk;
		};
		const onMouseUp = () => {
			suppressClick = dragging;
			pressed = false;
			dragging = false;
		};
		// a drag that lands on a pill shouldn't select it
		const onClick = (event: MouseEvent) => {
			if (suppressClick) {
				suppressClick = false;
				event.preventDefault();
				event.stopPropagation();
			}
		};
		// prevent native link/image dragging from interrupting scrolling
		const onDragStart = (event: DragEvent) => event.preventDefault();

		row.addEventListener('click', onClick, { capture: true });
		row.addEventListener('dragstart', onDragStart);
		row.addEventListener('mousedown', onMouseDown);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		return () => {
			row.removeEventListener('click', onClick, { capture: true });
			row.removeEventListener('dragstart', onDragStart);
			row.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, []);

	return (
		<div className={css.outer} style={assignInlineVars({ [css.gutterVar]: `${gutterWidth}px` })}>
			<div className={css.scroller} ref={scrollerRef}>
				{children}
			</div>
			<ScrollArrow direction="left" scrollerRef={scrollerRef} visible={canScrollLeft} />
			<ScrollArrow direction="right" scrollerRef={scrollerRef} visible={canScrollRight} />
		</div>
	);
}

const ARROWS = {
	left: {
		icon: ArrowLeft,
		label: () => m['common.a11y.scrollLeft'](),
		sign: -1,
	},
	right: {
		icon: ArrowRight,
		label: () => m['common.a11y.scrollRight'](),
		sign: 1,
	},
};

function ScrollArrow({
	direction,
	scrollerRef,
	visible,
}: {
	direction: keyof typeof ARROWS;
	scrollerRef: RefObject<HTMLDivElement | null>;
	visible: boolean;
}) {
	const { icon, label, sign } = ARROWS[direction];
	const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const holdFrame = useRef<number | null>(null);
	// suppress the click after hold scrolling
	const held = useRef(false);

	const stopHold = () => {
		if (holdTimeout.current !== null) {
			clearTimeout(holdTimeout.current);
			holdTimeout.current = null;
		}
		if (holdFrame.current !== null) {
			cancelAnimationFrame(holdFrame.current);
			holdFrame.current = null;
		}
	};

	// hidden arrows may not receive the pointer events that end a hold
	const stopHoldOnHide = useEffectEvent(stopHold);
	// oxlint-disable-next-line react/exhaustive-effect-dependencies -- visibility changes end the hold
	useEffect(() => () => stopHoldOnHide(), [visible]);

	const startHold = (event: PointerEvent) => {
		stopHold();
		held.current = false;
		if (event.button !== 0) {
			return;
		}
		holdTimeout.current = setTimeout(() => {
			held.current = true;
			const step = () => {
				const row = scrollerRef.current;
				if (!row) {
					return;
				}
				row.scrollLeft += sign * CONTINUOUS_SCROLL_SPEED;
				holdFrame.current = requestAnimationFrame(step);
			};
			holdFrame.current = requestAnimationFrame(step);
		}, CONTINUOUS_SCROLL_DELAY);
	};

	const step = () => {
		if (held.current) {
			held.current = false;
			return;
		}
		scrollerRef.current?.scrollBy({ behavior: 'smooth', left: sign * SCROLL_STEP });
	};

	// stay mounted for the fade-out transition
	return (
		<div className={css.edge} data-side={direction} data-visible={visible || undefined} inert={!visible}>
			<Button
				className={css.arrow}
				color="secondary"
				label={label()}
				onClick={step}
				onPointerDown={startHold}
				onPointerLeave={stopHold}
				onPointerUp={stopHold}
				shape="round"
				variant="outline"
			>
				<ButtonIcon icon={icon} />
			</Button>
		</div>
	);
}

/**
 * pill button inside a {@link Root}.
 *
 * @param props button props and active state
 * @returns a styled pill button
 */
export function Tab({
	active = false,
	children,
	className,
	...props
}: { active?: boolean; children: ReactNode } & ComponentPropsWithoutRef<'button'>) {
	'use no memo'; // forwarded props invalidate the generated wrapper cache

	return (
		<button
			{...props}
			className={clsx(css.tab({ active }), className)}
			data-active={active || undefined}
			type="button"
		>
			{children}
		</button>
	);
}

/**
 * text inside a pill
 *
 * @param props text content and typography overrides
 * @returns styled pill text
 */
export const TabText = ({ className, ...props }: Omit<TextProps, 'color'>) => {
	return (
		<Text
			selectable={false}
			size="md_sub"
			weight="medium"
			{...props}
			className={clsx(css.tabLabel, className)}
		/>
	);
};
