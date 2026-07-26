import { useId, useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

let activeViewId: string | null = null;
/** viewport-relative centre of the active view; `Infinity` while no view has claimed the slot. */
let activeViewLocation = Infinity;
/** whether the active view won by being pressed rather than by scrolling into a good position. */
let manuallySet = false;

let viewportHeight = window.innerHeight;
window.addEventListener('resize', () => {
	viewportHeight = window.innerHeight;
});

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

/** the state of the contest as one entrant sees it */
type SlotStatus = 'active' | 'other' | 'unclaimed';

const getSlotStatus = (viewId: string): SlotStatus => {
	if (activeViewId === viewId) {
		return 'active';
	}
	if (activeViewId !== null) {
		return 'other';
	}
	return 'unclaimed';
};

const distanceToIdealPosition = (y: number) => Math.abs(y - viewportHeight / 2.5);

const withinViewport = (y: number) => y > 0 && y < viewportHeight;

const setActiveView = (viewId: string) => {
	activeViewId = viewId;
	manuallySet = true;
	// the real position is unknown, but it is definitely on screen — any non-offscreen value will do
	activeViewLocation = viewportHeight / 2;
	emitter.emit();
};

const sendViewPosition = (viewId: string, y: number) => {
	if (viewId === activeViewId) {
		activeViewLocation = y;
		return;
	}

	if (distanceToIdealPosition(y) >= distanceToIdealPosition(activeViewLocation)) {
		return;
	}

	// if the old view was manually set, only usurp it once it has left the viewport
	if (manuallySet && withinViewport(activeViewLocation)) {
		return;
	}

	activeViewId = viewId;
	activeViewLocation = y;
	manuallySet = false;
	emitter.emit();
};

/** enter into the page-wide contest for the one video allowed to play at a time. */
export function useActiveVideo() {
	const id = useId();
	const status = useSyncExternalStore(subscribe, () => getSlotStatus(id));

	return {
		sendPosition: (y: number) => sendViewPosition(id, y),
		setActive: () => setActiveView(id),
		status,
	};
}
