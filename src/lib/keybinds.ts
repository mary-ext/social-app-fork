import { useEffect } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

/** callback run when a registered keybind matches. */
type KeybindHandler = (ev: KeyboardEvent) => void;

/** layer a keybind belongs to. only the highest-precedence active scope runs its keybinds. */
export type KeybindScope = 'app' | 'dialog' | 'drawer';

/** a scoped key or key sequence. */
export interface KeybindDefinition {
	/** scope in which the keybind can run. */
	scope: KeybindScope;
	/**
	 * nonempty, case-sensitive `KeyboardEvent.key` sequence. same-scope sequences must be unique and must not
	 * prefix one another.
	 */
	keys: readonly string[];
}

const SCOPE_PRECEDENCE: Record<KeybindScope, number> = {
	app: 0,
	drawer: 1,
	dialog: 2,
};

const SEQUENCE_TIMEOUT_MS = 1_500;

const MODIFIER_KEYS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'Meta', 'Shift']);

// these controls use printable keys for input or navigation
const TYPING_TARGET_SELECTOR = [
	'input',
	'select',
	'textarea',
	'[role="combobox"]',
	'[role="listbox"]',
	'[role="menu"]',
	'[role="searchbox"]',
	'[role="slider"]',
	'[role="spinbutton"]',
	'[role="textbox"]',
].join(', ');

interface Registration {
	definition: KeybindDefinition;
	handle: KeybindHandler;
}

const registrations = new Set<Registration>();
const activeScopes = new Set<KeybindScope>();

let keybindsEnabled = true;

let pending: { scope: KeybindScope; keys: string[] } | undefined;
let pendingTimeout: ReturnType<typeof setTimeout> | undefined;

const resetSequence = () => {
	pending = undefined;
	clearTimeout(pendingTimeout);
};

const getActiveScope = (): KeybindScope => {
	let active: KeybindScope = 'app';

	for (const scope of activeScopes) {
		if (SCOPE_PRECEDENCE[scope] > SCOPE_PRECEDENCE[active]) {
			active = scope;
		}
	}

	return active;
};

const isTypingTarget = (ev: KeyboardEvent): boolean => {
	const target = ev.composedPath()[0];
	if (!(target instanceof Element)) {
		return false;
	}

	return (
		(target instanceof HTMLElement && target.isContentEditable) ||
		target.closest(TYPING_TARGET_SELECTOR) !== null
	);
};

const startsWith = (keys: readonly string[], prefix: readonly string[]): boolean => {
	return prefix.length <= keys.length && prefix.every((key, idx) => keys[idx] === key);
};

window.addEventListener('keydown', (ev) => {
	// preserve the sequence across key repeats and modifiers such as shift
	if (ev.repeat || MODIFIER_KEYS.has(ev.key)) {
		return;
	}

	if (
		ev.defaultPrevented ||
		ev.isComposing ||
		ev.altKey ||
		ev.ctrlKey ||
		ev.metaKey ||
		ev.getModifierState('AltGraph') ||
		!keybindsEnabled ||
		isTypingTarget(ev)
	) {
		resetSequence();
		return;
	}

	const scope = getActiveScope();
	const keys = pending?.scope === scope ? [...pending.keys, ev.key] : [ev.key];
	resetSequence();

	let isPrefix = false;
	for (const registration of registrations) {
		const { definition } = registration;
		if (definition.scope !== scope || !startsWith(definition.keys, keys)) {
			continue;
		}

		if (definition.keys.length === keys.length) {
			ev.preventDefault();
			registration.handle(ev);
			return;
		}

		isPrefix = true;
	}

	// don't retry a failed sequence as a single-key shortcut
	if (isPrefix) {
		ev.preventDefault();
		pending = { scope, keys };
		pendingTimeout = setTimeout(resetSequence, SEQUENCE_TIMEOUT_MS);
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

/**
 * enables or disables all registered keybinds.
 *
 * @param enabled whether keybinds should run
 */
export function setKeybindsEnabled(enabled: boolean): void {
	keybindsEnabled = enabled;
	if (!enabled) {
		resetSequence();
	}
}

const warnOnConflict = (definition: KeybindDefinition) => {
	for (const { definition: other } of registrations) {
		if (
			other.scope === definition.scope &&
			(startsWith(other.keys, definition.keys) || startsWith(definition.keys, other.keys))
		) {
			console.error(`keybind \`${definition.keys.join(' ')}\` collides with \`${other.keys.join(' ')}\``);
		}
	}
};

interface UseKeybindOptions {
	/** keep the reference stable to avoid re-registering. */
	keybind: KeybindDefinition;
	/** when false, leaves the keybind unregistered. defaults to true. */
	enabled?: boolean;
	handle: KeybindHandler;
}

/**
 * registers a keybind for the component's lifetime. runs in the active scope, outside text input and
 * keyboard-operated controls. shift is allowed; alt, control, meta, composing, repeated, and handled events
 * are ignored.
 *
 * @param options the keybind to register
 */
export function useKeybind({ keybind, handle, enabled = true }: UseKeybindOptions): void {
	const stableHandle = useNonReactiveCallback(handle);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (import.meta.env.DEV) {
			warnOnConflict(keybind);
		}

		const registration: Registration = {
			definition: keybind,
			handle: stableHandle,
		};

		registrations.add(registration);

		return () => {
			registrations.delete(registration);
		};
	}, [enabled, keybind, stableHandle]);
}
