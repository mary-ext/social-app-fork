import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';
import { MODIFIERS } from '@mary/keybinds';

import { IS_WEB_TOUCH_DEVICE } from '#/env';

/** the kind of input the user is currently driving the ui with */
export type InputModality = 'keyboard' | 'mouse' | 'pen' | 'touch';

const emitter = new SimpleEventEmitter<[]>();

let modality: InputModality = IS_WEB_TOUCH_DEVICE ? 'touch' : 'mouse';

const setModality = (next: InputModality) => {
	if (next !== modality) {
		modality = next;
		emitter.emit();
	}
};

const onPointerEvent = (evt: PointerEvent) => {
	setModality(evt.pointerType === 'touch' || evt.pointerType === 'pen' ? evt.pointerType : 'mouse');
};

const onKeyDown = (evt: KeyboardEvent) => {
	if (MODIFIERS.includes(evt.key)) {
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

/**
 * Reactive input modality hook, for behavior that has to follow the input in use rather than what the device
 * is capable of.
 *
 * @returns the input modality of the most recent interaction
 */
export const useInputModality = (): InputModality => {
	return useSyncExternalStore(subscribe, getSnapshot);
};
