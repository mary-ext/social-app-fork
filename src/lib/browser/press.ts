import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';

import { PRESSED_ATTR } from '#/styles/interaction';

const PRESSABLE_SELECTOR = `[data-press], ${INTERACTIVE_SELECTOR}`;

// delay touch feedback until the gesture is distinguishable from scrolling
const SHOW_DELAY = 60;
// keep fast taps perceptible
const MIN_VISIBLE = 120;
const SLOP = 10;

type Press = {
	element: Element;
	pointerId: number;
	deferred: boolean;
	x: number;
	y: number;
};

let press: Press | null = null;
let shown: Element | null = null;
let shownAt = 0;
let showTimer: number | undefined;
let hideTimer: number | undefined;

const paint = () => {
	if (press === null) {
		return;
	}

	shown = press.element;
	shown.setAttribute(PRESSED_ATTR, '');
	shownAt = performance.now();
};

const unpaint = () => {
	shown?.removeAttribute(PRESSED_ATTR);
	shown = null;
};

const forget = () => {
	clearTimeout(showTimer);
	showTimer = undefined;
	press = null;
};

const cancel = () => {
	forget();
	clearTimeout(hideTimer);
	hideTimer = undefined;
	unpaint();
};

const release = () => {
	const deferred = press?.deferred ?? false;
	forget();

	if (shown === null) {
		return;
	}

	const elapsed = performance.now() - shownAt;
	if (!deferred || elapsed >= MIN_VISIBLE) {
		unpaint();
		return;
	}

	hideTimer = setTimeout(() => {
		hideTimer = undefined;
		unpaint();
	}, MIN_VISIBLE - elapsed);
};

const findPressable = (from: Element): Element | null => {
	let candidate = from.closest(PRESSABLE_SELECTOR);
	// skip `display: contents` wrappers, which cannot paint feedback
	while (candidate !== null && candidate.getClientRects().length === 0) {
		candidate = candidate.parentElement?.closest(PRESSABLE_SELECTOR) ?? null;
	}

	return candidate;
};

const onPointerDown = (evt: PointerEvent) => {
	if (!evt.isPrimary || (evt.pointerType === 'mouse' && evt.button !== 0)) {
		return;
	}

	cancel();

	const target = evt.target;
	const element = target instanceof Element ? findPressable(target) : null;
	if (element === null) {
		return;
	}

	press = {
		element,
		pointerId: evt.pointerId,
		deferred: evt.pointerType !== 'mouse',
		x: evt.clientX,
		y: evt.clientY,
	};

	if (!press.deferred) {
		paint();
		return;
	}

	showTimer = setTimeout(paint, SHOW_DELAY);
};

const onPointerMove = (evt: PointerEvent) => {
	if (press === null || evt.pointerId !== press.pointerId) {
		return;
	}

	if (Math.abs(evt.clientX - press.x) > SLOP || Math.abs(evt.clientY - press.y) > SLOP) {
		cancel();
	}
};

const onPointerUp = (evt: PointerEvent) => {
	if (press !== null && evt.pointerId === press.pointerId) {
		release();
	}
};

const onPointerCancel = (evt: PointerEvent) => {
	if (press !== null && evt.pointerId === press.pointerId) {
		cancel();
	}
};

const onScroll = () => {
	if (press !== null || shown !== null) {
		cancel();
	}
};

/** starts delegated press feedback */
export const initPressFeedback = (): void => {
	const options = { capture: true, passive: true } as const;

	window.addEventListener('pointerdown', onPointerDown, options);
	window.addEventListener('pointermove', onPointerMove, options);
	window.addEventListener('pointerup', onPointerUp, options);
	window.addEventListener('pointercancel', onPointerCancel, options);
	window.addEventListener('contextmenu', cancel, options);
	// capture scroll events from every scroller
	window.addEventListener('scroll', onScroll, options);
	// captured blur would cancel presses when inner elements lose focus
	window.addEventListener('blur', cancel);
};
