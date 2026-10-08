import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { IS_TOUCH_DEVICE } from '#/lib/browser/platform';

import { POINTER_ATTR } from '#/styles/interaction';

/** the kind of input the user is currently driving the ui with */
export type InputModality = 'keyboard' | 'mouse' | 'pen' | 'touch';

/** pointer type last used */
export type PointerModality = Exclude<InputModality, 'keyboard'>;

/** input for an interaction; `''` when unknown. */
export type InteractionType = InputModality | '';

/**
 * @param pointerType a pointer event's `pointerType`
 * @returns the pointer type, or `''` if unknown
 */
export const toInteractionType = (pointerType: string): InteractionType => {
	switch (pointerType) {
		case 'mouse':
		case 'pen':
		case 'touch': {
			return pointerType;
		}
		default: {
			return '';
		}
	}
};

/**
 * @param event event that triggered an interaction
 * @returns the input that produced it, or `''` if unknown
 */
export const getInteractionType = (event: Event): InteractionType => {
	if (event instanceof KeyboardEvent) {
		return 'keyboard';
	}
	// keyboard activation dispatches a click without a press.
	if (event.type === 'click' && event instanceof MouseEvent && event.detail === 0) {
		return 'keyboard';
	}
	if (event instanceof PointerEvent && event.pointerType !== '') {
		return toInteractionType(event.pointerType);
	}
	// desktop Firefox leaves `TouchEvent` undefined.
	if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
		return 'touch';
	}
	if (event instanceof MouseEvent) {
		return 'mouse';
	}
	return '';
};

/**
 * @param event pointer event to classify
 * @returns whether the pointer is a mouse or pen
 */
export const isMouseLike = (event: { pointerType: string }): boolean => {
	// some Linux Chromium builds report mouse input as "pen".
	return event.pointerType === 'mouse' || event.pointerType === 'pen';
};

const emitter = new SimpleEventEmitter<[]>();

const initial: PointerModality = IS_TOUCH_DEVICE ? 'touch' : 'mouse';

let modality: InputModality = initial;
// keyboard input must not clear pointer hover state
let pointerModality: PointerModality = initial;

const setModality = (next: InputModality) => {
	if (next !== modality) {
		modality = next;
		emitter.emit();
	}
};

const onPointerEvent = (evt: PointerEvent) => {
	const next: PointerModality =
		evt.pointerType === 'touch' || evt.pointerType === 'pen' ? evt.pointerType : 'mouse';

	pointerModality = next;
	setModality(next);
};

const onKeyDown = (evt: KeyboardEvent) => {
	if (['Alt', 'Control', 'Meta', 'Shift'].includes(evt.key)) {
		return;
	}

	setModality('keyboard');
};

const subscribe = (listener: () => void) => {
	if (!emitter.hasListeners()) {
		window.addEventListener('pointerdown', onPointerEvent, { capture: true, passive: true });
		window.addEventListener('pointermove', onPointerEvent, { capture: true, passive: true });
		window.addEventListener('keydown', onKeyDown, { capture: true, passive: true });
	}

	const unsubscribe = emitter.subscribe(listener);

	return () => {
		unsubscribe();

		if (!emitter.hasListeners()) {
			window.removeEventListener('pointerdown', onPointerEvent, { capture: true });
			window.removeEventListener('pointermove', onPointerEvent, { capture: true });
			window.removeEventListener('keydown', onKeyDown, { capture: true });
		}
	};
};

const getSnapshot = () => modality;

/** mirrors pointer modality onto `<html>` for input-aware styles */
export const initInputModality = (): void => {
	const root = document.documentElement;

	const apply = () => {
		if (root.getAttribute(POINTER_ATTR) !== pointerModality) {
			root.setAttribute(POINTER_ATTR, pointerModality);
		}
	};

	apply();
	subscribe(apply);
};

/**
 * Reactive input modality hook, for behavior that has to follow the input in use rather than what the device
 * is capable of.
 *
 * @returns the input modality of the most recent interaction
 */
export const useInputModality = (): InputModality => {
	return useSyncExternalStore(subscribe, getSnapshot);
};
