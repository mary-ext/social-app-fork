import { device, useStorage } from '#/storage';

export function useDevMode() {
	const [devMode = false, setDevMode] = useStorage(device, ['devMode']);

	return [devMode, setDevMode] as const;
}

let cachedIsDevMode: boolean | undefined;
/**
 * retrieves the dev mode state from storage and caches it in memory. reload the app to apply changes after
 * toggling.
 */
export function isDevMode() {
	if (import.meta.env.DEV) {
		return true;
	}
	if (cachedIsDevMode === undefined) {
		cachedIsDevMode = device.get(['devMode']) ?? false;
	}
	return cachedIsDevMode;
}
