import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { logger } from '#/logger';

/**
 * lifecycle status of the service worker from the page's point of view:
 *
 * - `uninstalled` — no worker is registered for this page. offline support is not active.
 * - `installing` — a first-ever install is downloading.
 * - `installed` — a worker is active and no update is pending.
 * - `update_installing` — a new worker is downloading or installing over the active one.
 * - `update_ready` — a new worker has installed and is waiting to activate. call
 *   {@link applyServiceWorkerUpdate} to activate.
 */
export type ServiceWorkerStatus =
	| 'installed'
	| 'installing'
	| 'uninstalled'
	| 'update_installing'
	| 'update_ready';

const events = new SimpleEventEmitter<[ServiceWorkerStatus]>();
let status: ServiceWorkerStatus = 'uninstalled';
let registration: ServiceWorkerRegistration | undefined;

const setStatus = (next: ServiceWorkerStatus) => {
	if (next === status) {
		return;
	}
	status = next;
	events.emit(status);
};

// the single source of truth: derive status from the registration's worker slots. `active` distinguishes
// a first install (none yet) from an update (installing over an existing one), and surviving in the
// module means progress isn't lost when a consuming component unmounts mid-install.
const reconcile = () => {
	const reg = registration;
	if (reg?.waiting) {
		setStatus('update_ready');
	} else if (reg?.installing) {
		setStatus(reg.active ? 'update_installing' : 'installing');
	} else {
		setStatus(reg?.active ? 'installed' : 'uninstalled');
	}
};

/** @returns the current service-worker status */
export const getServiceWorkerStatus = () => status;

/** Subscribe to service-worker status changes. */
export const subscribeServiceWorkerStatus = (listener: (status: ServiceWorkerStatus) => void) =>
	events.subscribe(listener);

/** React hook returning the live {@link ServiceWorkerStatus}. */
export const useServiceWorkerStatus = () =>
	useSyncExternalStore(subscribeServiceWorkerStatus, getServiceWorkerStatus);

const attach = (reg: ServiceWorkerRegistration) => {
	registration = reg;
	reconcile();
	// an install activating and claiming the page, or an update taking control, both surface as a
	// controller change.
	navigator.serviceWorker.addEventListener('controllerchange', reconcile);
	// reconcile against the registration's current state, not just future events: a reload can land
	// after `updatefound` already fired, leaving a worker parked in `waiting` or still `installing`.
	if (reg.installing) {
		reg.installing.addEventListener('statechange', reconcile);
	}
	reg.addEventListener('updatefound', () => {
		reconcile();
		reg.installing?.addEventListener('statechange', reconcile);
	});
};

/** begin tracking an already-registered service worker without installing one. call once at startup. */
export const initServiceWorker = () => {
	if (registration || !('serviceWorker' in navigator)) {
		return;
	}
	// reflect an already-controlling worker before the async lookup resolves
	if (navigator.serviceWorker.controller) {
		setStatus('installed');
	}
	navigator.serviceWorker.getRegistration().then(
		(reg) => {
			if (reg && !registration) {
				attach(reg);
			}
		},
		(err) => {
			logger.error('service worker lookup failed', {
				safeMessage: err instanceof Error ? err.message : String(err),
			});
		},
	);
};

/**
 * install the service worker and trigger the precache download. call this from an explicit user action. no-op
 * if already registered.
 */
export const registerServiceWorker = () => {
	// dev builds emit no `/sw.js`, so registering would 404. keep the settings row visible but inert.
	if (import.meta.env.DEV || registration || !('serviceWorker' in navigator)) {
		return;
	}
	navigator.serviceWorker.register('/sw.js').then(attach, (err) => {
		logger.error('service worker registration failed', {
			safeMessage: err instanceof Error ? err.message : String(err),
		});
	});
};

/** Activate a waiting service worker and reload once it takes control. No-op if no update is ready. */
export const applyServiceWorkerUpdate = () => {
	const waiting = registration?.waiting;
	if (!waiting) {
		return;
	}
	let reloaded = false;
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		// `controllerchange` can fire more than once; guard against a reload loop.
		if (reloaded) {
			return;
		}
		reloaded = true;
		window.location.reload();
	});
	waiting.postMessage({ type: 'SKIP_WAITING' });
};
