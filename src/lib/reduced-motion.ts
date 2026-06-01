import { useSyncExternalStore } from 'react';
import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

// central, reactive view of the OS reduced-motion preference: one shared MediaQueryList kept live
// by a single `change` listener, rather than probing matchMedia on every read.

const query = window.matchMedia('(prefers-reduced-motion: reduce)');
const emitter = new SimpleEventEmitter<[]>();

let enabled = query.matches;

query.addEventListener('change', (event) => {
	enabled = event.matches;
	emitter.emit();
});

/** Returns whether the user prefers reduced motion. Tracked live; safe to call outside React. */
export function getReducedMotion() {
	return enabled;
}

/** Subscribes to the reduced-motion preference, re-rendering the caller when it changes. */
export function useReducedMotion() {
	return useSyncExternalStore((callback) => emitter.subscribe(callback), getReducedMotion);
}
