import { useSyncExternalStore } from 'react';

import type { JsonObject } from 'type-fest';

import type { Storage } from '#/storage/storage';

/**
 * hook to subscribe to and update a storage key.
 *
 * @param storage storage instance to read from and write to
 * @param scopes array of scope identifiers leading to the key
 * @returns tuple of current value and setter function
 */
export function useStorage<Scopes extends unknown[], Schema extends JsonObject, Key extends keyof Schema>(
	storage: Storage<Scopes, Schema>,
	scopes: [...Scopes, Key],
): [Schema[Key] | undefined, (data: Schema[Key]) => void] {
	const value = useSyncExternalStore(
		(callback) => storage.onScopeChange(scopes, callback),
		() => storage.get(scopes),
	);

	const setter = (data: Schema[Key]) => {
		storage.set(scopes, data);
	};

	return [value, setter];
}
