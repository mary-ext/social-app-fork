import { useEffect } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

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
	keybind: string;
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
	if (
		ev.defaultPrevented ||
		ev.isComposing ||
		ev.repeat ||
		ev.altKey ||
		ev.ctrlKey ||
		ev.metaKey ||
		ev.getModifierState('AltGraph')
	) {
		return;
	}

	const target = ev.composedPath()[0];
	if (
		target instanceof HTMLElement &&
		(target.isContentEditable || target.closest('input, select, textarea'))
	) {
		return;
	}

	const scope = getActiveScope();

	for (const registration of registrations) {
		if (registration.scope === scope && ev.key === registration.keybind) {
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
	/** literal, case-sensitive `KeyboardEvent.key` value; shift may produce the character */
	keybind: string;
	/** keybind handler */
	handle: KeybindHandler;
}

/**
 * registers a shortcut without alt, control, or meta, outside form fields and editable content. composing,
 * repeated, and already-handled key events are ignored.
 *
 * @param options the keybind to register
 */
export function useKeybind({ scope, keybind, handle, enabled = true }: UseKeybindOptions): void {
	const stableHandle = useNonReactiveCallback(handle);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const registration: Registration = {
			scope,
			keybind,
			handle: stableHandle,
		};

		registrations.add(registration);

		return () => {
			registrations.delete(registration);
		};
	}, [enabled, keybind, scope, stableHandle]);
}
