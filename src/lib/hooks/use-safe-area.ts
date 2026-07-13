import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

export type EdgeInsets = {
	bottom: number;
	left: number;
	right: number;
	top: number;
};

const ZERO_INSETS: EdgeInsets = { bottom: 0, left: 0, right: 0, top: 0 };

// #region insets store

const insetsEmitter = new SimpleEventEmitter<[]>();

let probe: HTMLDivElement | null = null;
let insets: EdgeInsets = ZERO_INSETS;

const readInsets = (): EdgeInsets => {
	if (!probe) {
		return ZERO_INSETS;
	}
	const style = window.getComputedStyle(probe);
	return {
		bottom: parseInt(style.paddingBottom, 10) || 0,
		left: parseInt(style.paddingLeft, 10) || 0,
		right: parseInt(style.paddingRight, 10) || 0,
		top: parseInt(style.paddingTop, 10) || 0,
	};
};

const updateInsets = () => {
	const next = readInsets();
	if (
		next.top === insets.top &&
		next.right === insets.right &&
		next.bottom === insets.bottom &&
		next.left === insets.left
	) {
		return;
	}
	insets = next;
	insetsEmitter.emit();
};

const subscribeInsets = (listener: () => void): (() => void) => {
	if (!insetsEmitter.hasListeners()) {
		// A hidden probe whose padding tracks the env(safe-area-inset-*) values lets us read the
		// notch insets back out as pixels. The padding transition fires transitionend whenever the
		// insets change without a resize (e.g. the browser chrome sliding in/out).
		probe = document.createElement('div');
		const { style } = probe;
		style.position = 'fixed';
		style.top = '0';
		style.left = '0';
		style.width = '0';
		style.height = '0';
		style.zIndex = '-1';
		style.visibility = 'hidden';
		style.pointerEvents = 'none';
		style.transitionProperty = 'padding';
		style.transitionDuration = '0.05s';
		style.paddingTop = 'env(safe-area-inset-top, 0px)';
		style.paddingRight = 'env(safe-area-inset-right, 0px)';
		style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
		style.paddingLeft = 'env(safe-area-inset-left, 0px)';
		document.body.appendChild(probe);
		probe.addEventListener('transitionend', updateInsets);
		window.addEventListener('resize', updateInsets);
		window.addEventListener('orientationchange', updateInsets);
		insets = readInsets();
	}

	const unsubscribe = insetsEmitter.subscribe(listener);
	return () => {
		unsubscribe();
		if (!insetsEmitter.hasListeners() && probe) {
			probe.removeEventListener('transitionend', updateInsets);
			window.removeEventListener('resize', updateInsets);
			window.removeEventListener('orientationchange', updateInsets);
			document.body.removeChild(probe);
			probe = null;
			insets = ZERO_INSETS;
		}
	};
};

const getInsetsSnapshot = (): EdgeInsets => insets;

// #endregion

/**
 * Web-native replacement for `react-native-safe-area-context`'s `useSafeAreaInsets`, reading the
 * `env(safe-area-inset-*)` values for installed-PWA notch handling.
 *
 * @deprecated transitional shim; safe-area handling is being moved to CSS `env()` so the JS hook can
 *   eventually be dropped.
 * @returns the current safe-area insets in pixels
 */
export const useSafeAreaInsets = (): EdgeInsets =>
	useSyncExternalStore(subscribeInsets, getInsetsSnapshot, () => ZERO_INSETS);
