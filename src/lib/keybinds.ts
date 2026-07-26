import { useEffect } from 'react';

import { type Keybind, matchKeybind, parseKeybind } from '@mary/keybinds';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';

/** callback run when a registered keybind matches. */
type KeybindHandler = (ev: KeyboardEvent) => void;

/** layer a keybind belongs to. only the highest-precedence active scope runs its keybinds. */
export type KeybindScope = 'app' | 'dialog' | 'drawer';

const SCOPE_PRECEDENCE: Record<KeybindScope, number> = {
	app: 0,
	drawer: 1,
	dialog: 2,
};

interface Registration {
	scope: KeybindScope;
	keybind: Keybind;
	handle: KeybindHandler;
}

const registrations = new Set<Registration>();
const activeScopes = new Set<KeybindScope>();

const getActiveScope = (): KeybindScope => {
	let active: KeybindScope = 'app';

	for (const scope of activeScopes) {
		if (SCOPE_PRECEDENCE[scope] > SCOPE_PRECEDENCE[active]) {
			active = scope;
		}
	}

	return active;
};

window.addEventListener('keydown', (ev) => {
	if (ev.defaultPrevented) {
		return;
	}

	const scope = getActiveScope();

	for (const registration of registrations) {
		if (registration.scope === scope && matchKeybind(ev, registration.keybind)) {
			ev.preventDefault();
			registration.handle(ev);
			break;
		}
	}
});

/**
 * marks a scope as claiming the keyboard.
 *
 * @param scope the scope to switch
 * @param active whether the surface owning that scope is currently showing
 */
export function setKeybindScopeActive(scope: KeybindScope, active: boolean): void {
	if (active) {
		activeScopes.add(scope);
	} else {
		activeScopes.delete(scope);
	}
}

interface UseKeybindOptions {
	scope: KeybindScope;
	/** whether the keybind is enabled; a disabled one is left unregistered, so the page keeps the key */
	enabled?: boolean;
	/** keybind string */
	keybind: string;
	/** keybind handler */
	handle: KeybindHandler;
}

/**
 * registers a keybind.
 *
 * @param options the keybind to register
 * @throws {TypeError} if `keybind` names an unknown modifier
 */
export function useKeybind({ scope, keybind, handle, enabled = true }: UseKeybindOptions): void {
	const stableHandle = useNonReactiveCallback(handle);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const registration: Registration = {
			scope,
			keybind: parseKeybind(keybind),
			handle: stableHandle,
		};

		registrations.add(registration);

		return () => {
			registrations.delete(registration);
		};
	}, [enabled, keybind, scope, stableHandle]);
}
